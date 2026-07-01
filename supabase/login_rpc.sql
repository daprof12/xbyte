-- ============================================================================
-- ADMIN LOGIN RPC FUNCTION
-- ============================================================================
-- This function verifies user credentials against the public.users table.
-- It checks if the email exists, the user is an admin, and the password matches.
-- Run this script in your Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.verify_admin_login(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user public.users;
BEGIN
    -- Look up the user by email
    SELECT * INTO v_user
    FROM public.users
    WHERE email = p_email AND is_admin = TRUE;
    
    -- Verify password hash using pgcrypto's crypt function
    IF v_user.id IS NOT NULL AND v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
        RETURN jsonb_build_object(
            'success', true, 
            'user', jsonb_build_object(
                'id', v_user.id,
                'email', v_user.email,
                'full_name', v_user.full_name
            )
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'Invalid email or password'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
