-- 1. FIX INFINITE RECURSION IN RLS POLICIES
-- Create a security definer function to check if a user is admin without triggering RLS on users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all recursive policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- Recreate policies using the new function
CREATE POLICY "Admins can view all users" ON public.users
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR ALL USING ( public.is_admin() );


-- 2. SEED MOCK DATA
-- We use DO block to generate UUIDs and insert them properly

DO $$
DECLARE
    admin_id UUID := gen_random_uuid();
    user1_id UUID := gen_random_uuid();
    user2_id UUID := gen_random_uuid();
    wallet1_id UUID := gen_random_uuid();
    wallet2_id UUID := gen_random_uuid();
    btc_id UUID;
    eth_id UUID;
    sol_id UUID;
    bnb_id UUID;
    usdt_id UUID;
BEGIN
    -- Get asset IDs
    SELECT id INTO btc_id FROM public.assets WHERE symbol = 'BTC';
    SELECT id INTO eth_id FROM public.assets WHERE symbol = 'ETH';
    SELECT id INTO sol_id FROM public.assets WHERE symbol = 'SOL';
    SELECT id INTO bnb_id FROM public.assets WHERE symbol = 'BNB';
    SELECT id INTO usdt_id FROM public.assets WHERE symbol = 'USDT';

    -- Insert into auth.users (minimal required fields for Supabase auth)
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES 
    (admin_id, '00000000-0000-0000-0000-000000000000', 'admin@xbyte.io', crypt('admin123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', '', '', '', ''),
    (user1_id, '00000000-0000-0000-0000-000000000000', 'john@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', '', '', '', ''),
    (user2_id, '00000000-0000-0000-0000-000000000000', 'sarah@example.com', crypt('password456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{}', NOW(), NOW(), 'authenticated', '', '', '', '');

    -- Insert into public.users
    INSERT INTO public.users (id, email, password_hash, full_name, status, is_admin, is_verified, metadata)
    VALUES 
    (admin_id, 'admin@xbyte.io', 'hashed_password_admin', 'Super Admin', 'active', true, true, '{"kyc_status": "verified"}'::jsonb),
    (user1_id, 'john@example.com', 'hashed_password_123', 'John Doe', 'active', false, true, '{"kyc_status": "verified"}'::jsonb),
    (user2_id, 'sarah@example.com', 'hashed_password_456', 'Sarah Smith', 'active', false, false, '{"kyc_status": "pending"}'::jsonb);

    -- Insert wallets
    INSERT INTO public.wallets (id, user_id, name, mnemonic_encrypted, encryption_salt, is_primary)
    VALUES
    (wallet1_id, user1_id, 'Main Wallet', 'encrypted_mnemonic_1', 'salt1', true),
    (wallet2_id, user2_id, 'Main Wallet', 'encrypted_mnemonic_2', 'salt2', true);

    -- Insert balances
    INSERT INTO public.wallet_balances (wallet_id, asset_id, balance) VALUES
    (wallet1_id, btc_id, 0.5), (wallet1_id, eth_id, 10.0), (wallet1_id, sol_id, 50.0), (wallet1_id, bnb_id, 5.0), (wallet1_id, usdt_id, 5000.0),
    (wallet2_id, btc_id, 0.1), (wallet2_id, eth_id, 2.5), (wallet2_id, sol_id, 15.0), (wallet2_id, bnb_id, 1.2), (wallet2_id, usdt_id, 1200.0);

    -- Insert addresses
    INSERT INTO public.wallet_addresses (wallet_id, asset_id, address) VALUES
    (wallet1_id, btc_id, 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'), (wallet1_id, eth_id, '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'), (wallet1_id, sol_id, '7YpJ5x9nE4kBYmJmGKZhCvXBAPngXzFqPmgvT8KJnKvH'), (wallet1_id, bnb_id, 'bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23'), (wallet1_id, usdt_id, 'TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe'),
    (wallet2_id, btc_id, 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'), (wallet2_id, eth_id, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'), (wallet2_id, sol_id, 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK'), (wallet2_id, bnb_id, 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2'), (wallet2_id, usdt_id, 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9');

    -- Insert activities
    INSERT INTO public.transactions (wallet_id, user_id, type, asset_id, asset_symbol, amount, from_address, to_address, network, status, hash) VALUES
    (wallet1_id, user1_id, 'send', eth_id, 'ETH', 0.5, '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Ethereum', 'pending', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
    (wallet2_id, user2_id, 'swap', bnb_id, 'BNB', 0.5, NULL, NULL, 'BNB Smart Chain', 'completed', '0xaaa111bbb222ccc333ddd444eee555fff666aaa777bbb888ccc999ddd000eee');

    -- Insert admin fees if not exists
    INSERT INTO public.admin_fee_settings (asset_id, asset_symbol, withdraw_fee, gas_fee_enabled, gas_fee_fixed) VALUES
    (btc_id, 'BTC', 0.0005, true, 0.00001),
    (eth_id, 'ETH', 0.003, true, 0.0015),
    (sol_id, 'SOL', 0.001, true, 0.000005),
    (bnb_id, 'BNB', 0.002, true, 0.0008),
    (usdt_id, 'USDT', 1.0, true, 1.5)
    ON CONFLICT (asset_symbol) DO NOTHING;

END $$;
