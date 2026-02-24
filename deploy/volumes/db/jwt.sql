-- Supabase Self-Hosted — JWT Configuration
-- Sets up JWT secret for PostgREST token verification

ALTER DATABASE postgres SET "app.settings.jwt_secret" TO current_setting('JWT_SECRET', true);
ALTER DATABASE postgres SET "app.settings.jwt_exp" TO current_setting('JWT_EXP', true);
