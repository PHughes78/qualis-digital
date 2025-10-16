-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_care_homes ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to care home
CREATE OR REPLACE FUNCTION user_has_care_home_access(user_id UUID, home_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Business owners can access all care homes
    IF get_user_role(user_id) = 'business_owner' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is assigned to the care home or is the manager
    RETURN EXISTS (
        SELECT 1 FROM user_care_homes 
        WHERE user_care_homes.user_id = user_has_care_home_access.user_id 
        AND user_care_homes.care_home_id = home_id
    ) OR EXISTS (
        SELECT 1 FROM care_homes 
        WHERE care_homes.id = home_id 
        AND care_homes.manager_id = user_has_care_home_access.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Business owners can view all profiles" ON profiles
    FOR SELECT USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Managers can view profiles in their care homes" ON profiles
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'manager' AND
        EXISTS (
            SELECT 1 FROM user_care_homes uch1
            JOIN user_care_homes uch2 ON uch1.care_home_id = uch2.care_home_id
            WHERE uch1.user_id = auth.uid() AND uch2.user_id = profiles.id
        )
    );

-- Care Homes RLS Policies
CREATE POLICY "Business owners can manage all care homes" ON care_homes
    FOR ALL USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Managers can view their assigned care homes" ON care_homes
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'manager' AND
        (manager_id = auth.uid() OR user_has_care_home_access(auth.uid(), id))
    );

CREATE POLICY "Carers can view their assigned care homes" ON care_homes
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'carer' AND
        user_has_care_home_access(auth.uid(), id)
    );

-- Clients RLS Policies
CREATE POLICY "Business owners can manage all clients" ON clients
    FOR ALL USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users can view clients in their care homes" ON clients
    FOR SELECT USING (user_has_care_home_access(auth.uid(), care_home_id));

CREATE POLICY "Managers can manage clients in their care homes" ON clients
    FOR ALL USING (
        get_user_role(auth.uid()) = 'manager' AND
        user_has_care_home_access(auth.uid(), care_home_id)
    );

CREATE POLICY "Carers can update clients in their care homes" ON clients
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'carer' AND
        user_has_care_home_access(auth.uid(), care_home_id)
    );

-- Care Plans RLS Policies
CREATE POLICY "Business owners can manage all care plans" ON care_plans
    FOR ALL USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users can view care plans for clients in their care homes" ON care_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = care_plans.client_id
            AND user_has_care_home_access(auth.uid(), c.care_home_id)
        )
    );

CREATE POLICY "Managers can manage care plans in their care homes" ON care_plans
    FOR ALL USING (
        get_user_role(auth.uid()) = 'manager' AND
        EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = care_plans.client_id
            AND user_has_care_home_access(auth.uid(), c.care_home_id)
        )
    );

CREATE POLICY "Carers can create and update care plans" ON care_plans
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'carer' AND
        EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = care_plans.client_id
            AND user_has_care_home_access(auth.uid(), c.care_home_id)
        )
    );

CREATE POLICY "Carers can update care plans they created" ON care_plans
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'carer' AND
        created_by = auth.uid()
    );

-- Assessments RLS Policies
CREATE POLICY "Business owners can manage all assessments" ON assessments
    FOR ALL USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users can view assessments for clients in their care homes" ON assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = assessments.client_id
            AND user_has_care_home_access(auth.uid(), c.care_home_id)
        )
    );

CREATE POLICY "Managers can manage assessments in their care homes" ON assessments
    FOR ALL USING (
        get_user_role(auth.uid()) = 'manager' AND
        EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = assessments.client_id
            AND user_has_care_home_access(auth.uid(), c.care_home_id)
        )
    );

CREATE POLICY "Carers can create and update assessments" ON assessments
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'carer' AND
        EXISTS (
            SELECT 1 FROM clients c
            WHERE c.id = assessments.client_id
            AND user_has_care_home_access(auth.uid(), c.care_home_id)
        )
    );

CREATE POLICY "Carers can update assessments they conducted" ON assessments
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'carer' AND
        conducted_by = auth.uid()
    );

-- Handovers RLS Policies
CREATE POLICY "Business owners can manage all handovers" ON handovers
    FOR ALL USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users can view handovers for their care homes" ON handovers
    FOR SELECT USING (user_has_care_home_access(auth.uid(), care_home_id));

CREATE POLICY "Managers can manage handovers in their care homes" ON handovers
    FOR ALL USING (
        get_user_role(auth.uid()) = 'manager' AND
        user_has_care_home_access(auth.uid(), care_home_id)
    );

CREATE POLICY "Carers can create handovers" ON handovers
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'carer' AND
        user_has_care_home_access(auth.uid(), care_home_id)
    );

CREATE POLICY "Carers can update handovers they created" ON handovers
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'carer' AND
        (handover_from = auth.uid() OR handover_to = auth.uid())
    );

-- Handover Items RLS Policies
CREATE POLICY "Business owners can manage all handover items" ON handover_items
    FOR ALL USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users can view handover items for their care homes" ON handover_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM handovers h
            WHERE h.id = handover_items.handover_id
            AND user_has_care_home_access(auth.uid(), h.care_home_id)
        )
    );

CREATE POLICY "Managers can manage handover items in their care homes" ON handover_items
    FOR ALL USING (
        get_user_role(auth.uid()) = 'manager' AND
        EXISTS (
            SELECT 1 FROM handovers h
            WHERE h.id = handover_items.handover_id
            AND user_has_care_home_access(auth.uid(), h.care_home_id)
        )
    );

CREATE POLICY "Carers can manage handover items" ON handover_items
    FOR ALL USING (
        get_user_role(auth.uid()) = 'carer' AND
        EXISTS (
            SELECT 1 FROM handovers h
            WHERE h.id = handover_items.handover_id
            AND user_has_care_home_access(auth.uid(), h.care_home_id)
        )
    );

-- Incidents RLS Policies
CREATE POLICY "Business owners can manage all incidents" ON incidents
    FOR ALL USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users can view incidents for their care homes" ON incidents
    FOR SELECT USING (user_has_care_home_access(auth.uid(), care_home_id));

CREATE POLICY "Managers can manage incidents in their care homes" ON incidents
    FOR ALL USING (
        get_user_role(auth.uid()) = 'manager' AND
        user_has_care_home_access(auth.uid(), care_home_id)
    );

CREATE POLICY "Carers can create and update incidents" ON incidents
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'carer' AND
        user_has_care_home_access(auth.uid(), care_home_id)
    );

CREATE POLICY "Carers can update incidents they reported" ON incidents
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'carer' AND
        reported_by = auth.uid()
    );

-- User Care Homes RLS Policies
CREATE POLICY "Business owners can manage all user care home assignments" ON user_care_homes
    FOR ALL USING (get_user_role(auth.uid()) = 'business_owner');

CREATE POLICY "Users can view their own care home assignments" ON user_care_homes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view assignments for their care homes" ON user_care_homes
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'manager' AND
        user_has_care_home_access(auth.uid(), care_home_id)
    );