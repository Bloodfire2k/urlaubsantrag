-- Migration: Add annualLeaveDays and isActive to User table
-- Date: 2025-08-25
-- Description: Adds annualLeaveDays (default 25) and isActive (default true) fields to User model

-- add missing columns (idempotent)
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "annualLeaveDays" INTEGER NOT NULL DEFAULT 25;

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index for performance on isActive field
CREATE INDEX IF NOT EXISTS "users_isActive_idx" ON "users"("isActive");
