-- ============================================================================
-- UPDATE SCHEMA AND SEED DATA FOR SUPABASE USER AUTH & SYNC
-- ============================================================================

-- 1. Add columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS seed_phrase TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_address JSONB;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Adjust RLS Policies to allow profile insertion and profile updates
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
CREATE POLICY "Enable insert for all users" ON public.users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id OR is_admin = true);

-- 3. Define Admin Helper Functions (RPCs)
CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS SETOF public.users AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Admin privileges required';
  END IF;
  RETURN QUERY SELECT * FROM public.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_get_fee_settings()
RETURNS SETOF public.admin_fee_settings AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;
  RETURN QUERY SELECT * FROM public.admin_fee_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_get_transactions()
RETURNS SETOF public.transactions AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;
  RETURN QUERY SELECT * FROM public.transactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_get_audit_logs()
RETURNS SETOF public.audit_logs AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;
  RETURN QUERY SELECT * FROM public.audit_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_get_support_tickets()
RETURNS SETOF public.support_tickets AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;
  RETURN QUERY SELECT * FROM public.support_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_get_live_chats()
RETURNS SETOF public.live_chats AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;
  RETURN QUERY SELECT * FROM public.live_chats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Password Hashes with correct Crypt values
-- Update admin password to 'Admin@123'
UPDATE auth.users
SET encrypted_password = crypt('Admin@123', gen_salt('bf'))
WHERE email = 'admin@xbyte.io';

UPDATE public.users
SET password_hash = crypt('Admin@123', gen_salt('bf'))
WHERE email = 'admin@xbyte.io';

-- Update John Doe password to 'Password123!'
UPDATE auth.users
SET encrypted_password = crypt('Password123!', gen_salt('bf'))
WHERE email = 'john@example.com';

UPDATE public.users
SET password_hash = crypt('Password123!', gen_salt('bf'))
WHERE email = 'john@example.com';

-- Update Sarah Smith password to 'Password456!'
UPDATE auth.users
SET encrypted_password = crypt('Password456!', gen_salt('bf'))
WHERE email = 'sarah@example.com';

UPDATE public.users
SET password_hash = crypt('Password456!', gen_salt('bf'))
WHERE email = 'sarah@example.com';

-- Create check function for admin verification
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Insert new super admin: admin@pluto.com
DO $$
DECLARE
    new_admin_id UUID := '99999999-9999-9999-9999-999999999999'::uuid;
BEGIN
    -- Insert into auth.users (if needed by supabase auth)
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (new_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@pluto.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', '', '', '', '')
    ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('password123', gen_salt('bf'));

    -- Insert into public.users
    INSERT INTO public.users (id, email, password_hash, full_name, status, is_admin, is_verified, metadata)
    VALUES (new_admin_id, 'admin@pluto.com', crypt('password123', gen_salt('bf')), 'Super Admin Pluto', 'active', true, true, '{"kyc_status": "verified"}'::jsonb)
    ON CONFLICT (email) DO UPDATE SET 
        password_hash = crypt('password123', gen_salt('bf')),
        is_admin = true;
END $$;
