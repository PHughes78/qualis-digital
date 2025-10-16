-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('carer', 'manager', 'business_owner');

-- Care home types enum  
CREATE TYPE care_home_type AS ENUM ('residential', 'nursing', 'dementia', 'learning_disabilities', 'mental_health');

-- Assessment types enum
CREATE TYPE assessment_type AS ENUM ('initial', 'review', 'incident', 'health_check', 'care_plan_review');

-- Incident severity enum
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Incident status enum
CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'resolved', 'closed');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'carer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create care_homes table
CREATE TABLE care_homes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    postcode TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    care_home_type care_home_type NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    current_occupancy INTEGER DEFAULT 0 CHECK (current_occupancy >= 0),
    manager_id UUID REFERENCES profiles(id),
    cqc_rating TEXT,
    cqc_registration_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    CONSTRAINT check_occupancy_capacity CHECK (current_occupancy <= capacity)
);

-- Create clients table
CREATE TABLE clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
    nhs_number TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    address TEXT,
    postcode TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    gp_name TEXT,
    gp_practice TEXT,
    gp_phone TEXT,
    admission_date DATE,
    discharge_date DATE,
    room_number TEXT,
    dietary_requirements TEXT,
    allergies TEXT,
    medical_conditions TEXT,
    medications TEXT,
    mobility_notes TEXT,
    communication_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create care_plans table
CREATE TABLE care_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    goals TEXT,
    interventions TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    review_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create assessments table
CREATE TABLE assessments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    conducted_by UUID REFERENCES profiles(id),
    assessment_type assessment_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    findings TEXT,
    recommendations TEXT,
    score INTEGER,
    assessment_date DATE NOT NULL,
    next_review_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create handovers table
CREATE TABLE handovers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_type TEXT NOT NULL CHECK (shift_type IN ('day', 'evening', 'night')),
    handover_from UUID REFERENCES profiles(id),
    handover_to UUID REFERENCES profiles(id),
    general_notes TEXT,
    key_points TEXT,
    follow_up_actions TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create handover_items table (specific items for each client in a handover)
CREATE TABLE handover_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    handover_id UUID REFERENCES handovers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    notes TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    action_required BOOLEAN DEFAULT FALSE,
    action_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create incidents table
CREATE TABLE incidents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES profiles(id),
    incident_type TEXT NOT NULL,
    severity incident_severity NOT NULL,
    status incident_status DEFAULT 'open',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    injuries_sustained TEXT,
    witnesses TEXT,
    immediate_action_taken TEXT,
    investigation_notes TEXT,
    preventive_measures TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    resolved_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_care_homes junction table (for many-to-many relationship)
CREATE TABLE user_care_homes (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    care_home_id UUID REFERENCES care_homes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id, care_home_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_active ON profiles(is_active);
CREATE INDEX idx_care_homes_active ON care_homes(is_active);
CREATE INDEX idx_clients_care_home ON clients(care_home_id);
CREATE INDEX idx_clients_active ON clients(is_active);
CREATE INDEX idx_care_plans_client ON care_plans(client_id);
CREATE INDEX idx_care_plans_active ON care_plans(is_active);
CREATE INDEX idx_assessments_client ON assessments(client_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_handovers_care_home ON handovers(care_home_id);
CREATE INDEX idx_handovers_date ON handovers(shift_date);
CREATE INDEX idx_handover_items_handover ON handover_items(handover_id);
CREATE INDEX idx_handover_items_client ON handover_items(client_id);
CREATE INDEX idx_incidents_care_home ON incidents(care_home_id);
CREATE INDEX idx_incidents_client ON incidents(client_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_user_care_homes_user ON user_care_homes(user_id);
CREATE INDEX idx_user_care_homes_care_home ON user_care_homes(care_home_id);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_care_homes_updated_at BEFORE UPDATE ON care_homes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_handovers_updated_at BEFORE UPDATE ON handovers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();