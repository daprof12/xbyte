-- ============================================================================
-- Fix RLS Policies for SMTP Settings, Message Templates, and Notifications
-- Run this script in the Supabase SQL Editor to resolve the 403 Forbidden
-- "new row violates row-level security policy for table smtp_settings" error.
-- ============================================================================

-- 1. Ensure public.is_admin() checks both is_admin flag and admin roles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND (
        is_admin = true 
        OR role IN ('admin', 'super_admin')
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure RLS is enabled on messaging tables
ALTER TABLE IF EXISTS public.smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_sent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 3. Fix policies for smtp_settings
DROP POLICY IF EXISTS "Admins can do everything on smtp_settings" ON public.smtp_settings;
DROP POLICY IF EXISTS "Admins have full access to smtp_settings" ON public.smtp_settings;

CREATE POLICY "Admins have full access to smtp_settings" ON public.smtp_settings
    FOR ALL
    TO authenticated
    USING ( public.is_admin() )
    WITH CHECK ( public.is_admin() );

-- 4. Fix policies for message_templates
DROP POLICY IF EXISTS "Admins can do everything on message_templates" ON public.message_templates;
DROP POLICY IF EXISTS "Admins have full access to message_templates" ON public.message_templates;

CREATE POLICY "Admins have full access to message_templates" ON public.message_templates
    FOR ALL
    TO authenticated
    USING ( public.is_admin() )
    WITH CHECK ( public.is_admin() );

-- 5. Fix policies for admin_sent_messages
DROP POLICY IF EXISTS "Admins can do everything on admin_sent_messages" ON public.admin_sent_messages;
DROP POLICY IF EXISTS "Admins have full access to admin_sent_messages" ON public.admin_sent_messages;

CREATE POLICY "Admins have full access to admin_sent_messages" ON public.admin_sent_messages
    FOR ALL
    TO authenticated
    USING ( public.is_admin() )
    WITH CHECK ( public.is_admin() );

-- 6. Add policies for user_notifications
DROP POLICY IF EXISTS "Admins have full access to user_notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;

-- Admin full access to manage all notifications
CREATE POLICY "Admins have full access to user_notifications" ON public.user_notifications
    FOR ALL
    TO authenticated
    USING ( public.is_admin() )
    WITH CHECK ( public.is_admin() );

-- End users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
    FOR SELECT
    TO authenticated
    USING ( auth.uid() = user_id );

-- End users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.user_notifications
    FOR UPDATE
    TO authenticated
    USING ( auth.uid() = user_id )
    WITH CHECK ( auth.uid() = user_id );

-- 7. Ensure authenticated role has necessary table privileges
GRANT ALL ON public.smtp_settings TO authenticated;
GRANT ALL ON public.message_templates TO authenticated;
GRANT ALL ON public.admin_sent_messages TO authenticated;
GRANT ALL ON public.user_notifications TO authenticated;
