-- ============================================================================
-- SQL Migration: Fix RLS Policies for Wallets, Balances, Addresses, and Transactions
-- ============================================================================

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view own balances" ON public.wallet_balances;
DROP POLICY IF EXISTS "Users can update own balances" ON public.wallet_balances;
DROP POLICY IF EXISTS "Admins can view all balances" ON public.wallet_balances;

DROP POLICY IF EXISTS "Users can view own addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.wallet_addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.wallet_addresses;


-- 2. Define comprehensive policies for Wallets table
CREATE POLICY "Admins have full access to all wallets" ON public.wallets
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view own wallets" ON public.wallets
    FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own wallets" ON public.wallets
    FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own wallets" ON public.wallets
    FOR UPDATE USING ( auth.uid() = user_id );


-- 3. Define comprehensive policies for Wallet Balances table
CREATE POLICY "Admins have full access to all balances" ON public.wallet_balances
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view own balances" ON public.wallet_balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wallets w
            WHERE w.id = wallet_balances.wallet_id AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own balances" ON public.wallet_balances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wallets w
            WHERE w.id = wallet_balances.wallet_id AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own balances" ON public.wallet_balances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.wallets w
            WHERE w.id = wallet_balances.wallet_id AND w.user_id = auth.uid()
        )
    );


-- 4. Define comprehensive policies for Wallet Addresses table
CREATE POLICY "Admins have full access to all addresses" ON public.wallet_addresses
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view own addresses" ON public.wallet_addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wallets w
            WHERE w.id = wallet_addresses.wallet_id AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own addresses" ON public.wallet_addresses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wallets w
            WHERE w.id = wallet_addresses.wallet_id AND w.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own addresses" ON public.wallet_addresses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.wallets w
            WHERE w.id = wallet_addresses.wallet_id AND w.user_id = auth.uid()
        )
    );


-- 5. Define comprehensive policies for Transactions table
CREATE POLICY "Admins have full access to all transactions" ON public.transactions
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING ( auth.uid() = user_id );
