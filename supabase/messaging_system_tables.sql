-- ============================================================================
-- SQL Migration: Admin Messaging System
-- Creates tables for message templates, SMTP settings, and sent message logs
-- ============================================================================

-- Message Templates
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMTP Settings
CREATE TABLE IF NOT EXISTS public.smtp_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port TEXT NOT NULL,
    username TEXT,
    password TEXT,
    from_email TEXT NOT NULL,
    from_name TEXT,
    secure BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Sent Messages Log
CREATE TABLE IF NOT EXISTS public.admin_sent_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    delivery_method TEXT NOT NULL, -- 'in_app', 'email', 'both'
    recipients_count INTEGER NOT NULL DEFAULT 0,
    target_type TEXT NOT NULL, -- 'all', 'specific'
    target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sent_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sent_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admins
CREATE POLICY "Admins can do everything on message_templates" ON public.message_templates
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can do everything on smtp_settings" ON public.smtp_settings
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can do everything on admin_sent_messages" ON public.admin_sent_messages
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Seed initial templates if the table is empty
INSERT INTO public.message_templates (name, subject, body)
SELECT 'Welcome Message', 'Welcome to Micra!', '<h2>Welcome to Micra, {{user_name}}!</h2><p>We are excited to have you on board. Your account has been successfully created.</p><p>If you have any questions, feel free to contact our support team.</p><br/><p>Best Regards,<br/>Micra Team</p>'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Welcome Message');

INSERT INTO public.message_templates (name, subject, body)
SELECT 'KYC Approved', 'Your KYC Verification is Approved', '<h2>Congratulations {{user_name}}!</h2><p>Your identity verification (KYC) has been successfully approved.</p><p>You now have full access to all features on the Micra platform, including deposits and withdrawals.</p><br/><p>Best Regards,<br/>Micra Compliance Team</p>'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'KYC Approved');

INSERT INTO public.message_templates (name, subject, body)
SELECT 'KYC Rejected', 'Update on your KYC Verification', '<h2>Hello {{user_name}},</h2><p>Unfortunately, we could not verify the documents you provided for KYC verification.</p><p>Please log in to your account and submit clear, valid documents so we can process your verification.</p><br/><p>Best Regards,<br/>Micra Compliance Team</p>'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'KYC Rejected');

INSERT INTO public.message_templates (name, subject, body)
SELECT 'Deposit Received', 'Deposit Successful', '<h2>Hello {{user_name}},</h2><p>We have successfully received your recent deposit.</p><p>Your updated total balance is now ${{total_balance}}.</p><p>Thank you for using Micra!</p><br/><p>Best Regards,<br/>Micra Team</p>'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Deposit Received');

INSERT INTO public.message_templates (name, subject, body)
SELECT 'Withdrawal Processed', 'Withdrawal Successfully Processed', '<h2>Hello {{user_name}},</h2><p>Your recent withdrawal request has been successfully processed.</p><p>The funds should reflect in your destination wallet shortly depending on network confirmations.</p><br/><p>Best Regards,<br/>Micra Team</p>'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Withdrawal Processed');

INSERT INTO public.message_templates (name, subject, body)
SELECT 'Important Security Update', 'Important Security Notice regarding your Account', '<h2>Hello {{user_name}},</h2><p>We have detected a new login to your Micra account from an unrecognized device.</p><p>If this was you, you can safely ignore this email. If this was not you, please secure your account immediately by changing your password and enabling Two-Factor Authentication.</p><br/><p>Best Regards,<br/>Micra Security Team</p>'
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE name = 'Important Security Update');
