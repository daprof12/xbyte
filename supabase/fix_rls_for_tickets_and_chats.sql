-- ============================================================================
-- SQL Migration: Add RLS Policies for Tickets and Live Chats
-- ============================================================================

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can do everything on support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert own support_tickets" ON public.support_tickets;

DROP POLICY IF EXISTS "Admins can do everything on support_ticket_messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Users can view own support_ticket_messages" ON public.support_ticket_messages;
DROP POLICY IF EXISTS "Users can insert own support_ticket_messages" ON public.support_ticket_messages;

DROP POLICY IF EXISTS "Admins can do everything on live_chats" ON public.live_chats;
DROP POLICY IF EXISTS "Users can view own live_chats" ON public.live_chats;
DROP POLICY IF EXISTS "Users can insert own live_chats" ON public.live_chats;

DROP POLICY IF EXISTS "Admins can do everything on live_chat_messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can view own live_chat_messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can insert own live_chat_messages" ON public.live_chat_messages;


-- 2. Support Tickets Table
CREATE POLICY "Admins can do everything on support_tickets" ON public.support_tickets
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view own support_tickets" ON public.support_tickets
    FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own support_tickets" ON public.support_tickets
    FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own support_tickets" ON public.support_tickets
    FOR UPDATE USING ( auth.uid() = user_id );


-- 3. Support Ticket Messages Table
CREATE POLICY "Admins can do everything on support_ticket_messages" ON public.support_ticket_messages
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view own support_ticket_messages" ON public.support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = support_ticket_messages.ticket_id AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own support_ticket_messages" ON public.support_ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = support_ticket_messages.ticket_id AND t.user_id = auth.uid()
        )
    );


-- 4. Live Chats Table
CREATE POLICY "Admins can do everything on live_chats" ON public.live_chats
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view own live_chats" ON public.live_chats
    FOR SELECT USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own live_chats" ON public.live_chats
    FOR INSERT WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own live_chats" ON public.live_chats
    FOR UPDATE USING ( auth.uid() = user_id );


-- 5. Live Chat Messages Table
CREATE POLICY "Admins can do everything on live_chat_messages" ON public.live_chat_messages
    FOR ALL USING ( public.is_admin() );

CREATE POLICY "Users can view own live_chat_messages" ON public.live_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.live_chats c
            WHERE c.id = live_chat_messages.chat_id AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own live_chat_messages" ON public.live_chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.live_chats c
            WHERE c.id = live_chat_messages.chat_id AND c.user_id = auth.uid()
        )
    );
