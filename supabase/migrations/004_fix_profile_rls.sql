-- Fix for profile fetch hanging issue
-- The issue is that get_user_role() function can cause circular dependency
-- Let's make the helper function more efficient and add proper error handling

-- Drop and recreate the get_user_role function with better error handling
DROP FUNCTION IF EXISTS get_user_role(UUID);

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM profiles
    WHERE id = user_id
    LIMIT 1;
    
    RETURN user_role_result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add comment explaining the function
COMMENT ON FUNCTION get_user_role IS 'Get the role of a user by their ID. Returns NULL if user not found or error occurs.';

-- Ensure the basic profile policy is the first one checked (most specific first)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Add an index to improve profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
