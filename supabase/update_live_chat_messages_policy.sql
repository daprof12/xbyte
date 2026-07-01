-- ============================================================================
-- SQL Migration: Add UPDATE policy for live_chat_messages so users can mark them as read
-- ============================================================================

CREATE POLICY "Users can update own live_chat_messages" ON public.live_chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.live_chats c
            WHERE c.id = live_chat_messages.chat_id AND c.user_id = auth.uid()
        )
    );
