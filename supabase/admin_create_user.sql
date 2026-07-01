-- Create public.admin_create_user RPC function
CREATE OR REPLACE FUNCTION public.admin_create_user(
    p_email TEXT,
    p_password TEXT,
    p_kyc_status TEXT,
    p_balances JSONB,
    p_addresses JSONB
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Verify caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Admin privileges required';
    END IF;

    -- 1. Insert into auth.users (so they can log in via Supabase Auth)
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
        role, confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
        new_user_id, '00000000-0000-0000-0000-000000000000', p_email, 
        crypt(p_password, gen_salt('bf')), NOW(), 
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, NOW(), NOW(), 
        'authenticated', '', '', '', ''
    );

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, email, password_hash, full_name, status, is_admin, is_verified, metadata, wallet_address
    )
    VALUES (
        new_user_id, p_email, crypt(p_password, gen_salt('bf')), 
        split_part(p_email, '@', 1), 'active', false, false,
        jsonb_build_object(
            'kyc_status', p_kyc_status,
            'balances', p_balances,
            'addresses', p_addresses,
            'twoFactorAuth', '{"enabled": false, "preferredMethod": null, "passcode": null, "biometricEnabled": false, "biometricData": null, "setupDate": null}'::jsonb
        ),
        p_addresses
    );

    -- 3. Create wallet row
    INSERT INTO public.wallets (
        user_id, name, mnemonic_encrypted, encryption_salt, is_primary
    )
    VALUES (
        new_user_id, 'Main Wallet', '', new_user_id::text, true
    );

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
