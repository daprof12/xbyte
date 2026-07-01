-- Migration: Alter transaction_type enum to include 'credit' and 'debit'
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'credit';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'debit';
