-- Migration: Add Admin Roles and Permissions

-- 1. Make sure all existing admin users are designated as super_admin
UPDATE public.users 
SET role = 'super_admin' 
WHERE is_admin = true AND (role IS NULL OR role = 'user' OR role = 'admin');

-- 2. Add admin_permissions column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'admin_permissions') THEN
        ALTER TABLE public.users ADD COLUMN admin_permissions JSONB DEFAULT '{"allowed_tabs": [], "allowed_user_ids": []}'::JSONB;
    END IF;
END $$;

-- 3. Create or replace RPC to get admin users (only callable by super_admins in a real RLS setup, here using SECURITY DEFINER for ease of use)
CREATE OR REPLACE FUNCTION public.admin_get_admin_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT,
    is_admin BOOLEAN,
    admin_permissions JSONB,
    created_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    status public.user_status
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        u.id, 
        u.email, 
        u.full_name,
        u.role,
        u.is_admin,
        u.admin_permissions,
        u.created_at,
        u.last_login_at,
        u.status
    FROM public.users u
    WHERE u.is_admin = true
    ORDER BY u.created_at DESC;
END;
$$;

-- 4. Create RPC to create a new admin user
CREATE OR REPLACE FUNCTION public.admin_create_admin_user(
    p_email TEXT,
    p_password TEXT,
    p_role TEXT,
    p_permissions JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- This relies on Supabase Auth, but we can't easily create auth users from SQL without pgcrypto or auth.uid().
    -- Instead, we'll insert into public.users directly. A better approach is usually edge functions for admin creation.
    -- Assuming a simple insert for the public.users table (Auth user creation usually needs to happen via supabase-js admin API)
    -- We will just insert into users table and use a dummy password_hash for now, real app might use supabase.auth.signUp
    
    INSERT INTO public.users (
        email, 
        password_hash, 
        is_admin, 
        role, 
        admin_permissions,
        status,
        is_verified
    )
    VALUES (
        p_email,
        crypt(p_password, gen_salt('bf')),
        true,
        p_role,
        p_permissions,
        'active',
        true
    )
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$;

-- 5. Create RPC to update an admin user
CREATE OR REPLACE FUNCTION public.admin_update_admin_user(
    p_admin_id UUID,
    p_role TEXT,
    p_permissions JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET 
        role = p_role,
        admin_permissions = p_permissions,
        updated_at = NOW()
    WHERE id = p_admin_id AND is_admin = true;
    
    RETURN FOUND;
END;
$$;

-- 6. Create RPC to delete an admin user
CREATE OR REPLACE FUNCTION public.admin_delete_admin_user(
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.users
    WHERE id = p_admin_id AND is_admin = true AND role != 'super_admin'; -- prevent deleting super admins this way
    
    RETURN FOUND;
END;
$$;

-- 7. Modify audit log function to allow filtering by admin_id
DROP FUNCTION IF EXISTS public.admin_get_audit_logs(UUID);
DROP FUNCTION IF EXISTS public.admin_get_audit_logs();
CREATE OR REPLACE FUNCTION public.admin_get_audit_logs(
    p_admin_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    admin_id TEXT, -- Returning TEXT for backward compatibility (often maps to admin email/name in old structure)
    action TEXT,
    details TEXT,
    created_at TIMESTAMPTZ,
    ip_address INET
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        l.id, 
        COALESCE(u.email, l.admin_id::TEXT) as admin_id,
        l.action,
        (l.metadata->>'details')::TEXT as details,
        l.created_at,
        l.ip_address
    FROM public.audit_logs l
    LEFT JOIN public.users u ON u.id = l.admin_id
    WHERE (p_admin_id IS NULL OR l.admin_id::TEXT = p_admin_id OR u.email = p_admin_id)
    ORDER BY l.created_at DESC;
END;
$$;
