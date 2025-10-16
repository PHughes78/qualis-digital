-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name', ''), 'Not provided'),
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name', ''), 'Not provided'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'carer')
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update care home occupancy when clients are added/removed
CREATE OR REPLACE FUNCTION update_care_home_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increase occupancy when client is added
        UPDATE care_homes 
        SET current_occupancy = current_occupancy + 1,
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = NEW.care_home_id AND NEW.is_active = TRUE;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            -- Client became inactive, decrease occupancy
            UPDATE care_homes 
            SET current_occupancy = current_occupancy - 1,
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = NEW.care_home_id;
        ELSIF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
            -- Client became active, increase occupancy
            UPDATE care_homes 
            SET current_occupancy = current_occupancy + 1,
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = NEW.care_home_id;
        END IF;
        
        -- Handle care home transfers
        IF OLD.care_home_id != NEW.care_home_id THEN
            -- Decrease occupancy in old care home
            UPDATE care_homes 
            SET current_occupancy = current_occupancy - 1,
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = OLD.care_home_id AND OLD.is_active = TRUE;
            
            -- Increase occupancy in new care home
            UPDATE care_homes 
            SET current_occupancy = current_occupancy + 1,
                updated_at = TIMEZONE('utc'::text, NOW())
            WHERE id = NEW.care_home_id AND NEW.is_active = TRUE;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrease occupancy when client is deleted
        UPDATE care_homes 
        SET current_occupancy = current_occupancy - 1,
            updated_at = TIMEZONE('utc'::text, NOW())
        WHERE id = OLD.care_home_id AND OLD.is_active = TRUE;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for occupancy management
CREATE TRIGGER manage_care_home_occupancy
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_care_home_occupancy();

-- Function to validate care home capacity
CREATE OR REPLACE FUNCTION validate_care_home_capacity()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if adding this client would exceed capacity
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.care_home_id != OLD.care_home_id) THEN
        IF EXISTS (
            SELECT 1 FROM care_homes 
            WHERE id = NEW.care_home_id 
            AND current_occupancy >= capacity
            AND NEW.is_active = TRUE
        ) THEN
            RAISE EXCEPTION 'Care home is at full capacity';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for capacity validation
CREATE TRIGGER validate_capacity_before_client_change
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION validate_care_home_capacity();

-- Function to automatically set care plan review dates
CREATE OR REPLACE FUNCTION set_care_plan_review_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Set review date to 6 months from start date if not specified
    IF NEW.review_date IS NULL AND NEW.start_date IS NOT NULL THEN
        NEW.review_date = NEW.start_date + INTERVAL '6 months';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic review date setting
CREATE TRIGGER set_review_date_on_care_plan
    BEFORE INSERT OR UPDATE ON care_plans
    FOR EACH ROW EXECUTE FUNCTION set_care_plan_review_date();

-- Function to automatically set assessment next review dates
CREATE OR REPLACE FUNCTION set_assessment_review_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Set next review date based on assessment type
    IF NEW.next_review_date IS NULL AND NEW.assessment_date IS NOT NULL THEN
        CASE NEW.assessment_type
            WHEN 'initial' THEN
                NEW.next_review_date = NEW.assessment_date + INTERVAL '3 months';
            WHEN 'review' THEN
                NEW.next_review_date = NEW.assessment_date + INTERVAL '6 months';
            WHEN 'health_check' THEN
                NEW.next_review_date = NEW.assessment_date + INTERVAL '1 month';
            WHEN 'care_plan_review' THEN
                NEW.next_review_date = NEW.assessment_date + INTERVAL '6 months';
            ELSE
                NEW.next_review_date = NEW.assessment_date + INTERVAL '3 months';
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic assessment review date setting
CREATE TRIGGER set_review_date_on_assessment
    BEFORE INSERT OR UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION set_assessment_review_date();