-- Supabase Self-Hosted — Database Roles
-- Creates all required roles for PostgREST, Auth, Storage, etc.

-- Authenticator role (PostgREST connects as this)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD current_setting('app.settings.jwt_secret', true);
  END IF;
END
$$;

-- Anonymous role (unauthenticated requests)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- Authenticated role (logged-in users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
END
$$;

-- Service role (admin access, bypasses RLS)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- Supabase admin (internal services)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_admin') THEN
    CREATE ROLE supabase_admin NOLOGIN NOINHERIT BYPASSRLS CREATEROLE CREATEDB REPLICATION;
  END IF;
END
$$;

-- Auth admin
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOLOGIN NOINHERIT BYPASSRLS CREATEROLE;
  END IF;
END
$$;

-- Storage admin
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'supabase_storage_admin') THEN
    CREATE ROLE supabase_storage_admin NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- Grant role hierarchy
GRANT anon TO authenticator;
GRANT authenticated TO authenticator;
GRANT service_role TO authenticator;
GRANT supabase_admin TO postgres;
GRANT supabase_auth_admin TO postgres;
GRANT supabase_storage_admin TO postgres;

-- Set passwords (same as POSTGRES_PASSWORD for simplicity in self-hosted)
ALTER ROLE authenticator WITH PASSWORD :'PGPASSWORD';
ALTER ROLE supabase_auth_admin WITH PASSWORD :'PGPASSWORD';
ALTER ROLE supabase_storage_admin WITH PASSWORD :'PGPASSWORD';
ALTER ROLE supabase_admin WITH PASSWORD :'PGPASSWORD';
ALTER ROLE supabase_auth_admin WITH LOGIN;
ALTER ROLE supabase_storage_admin WITH LOGIN;
ALTER ROLE supabase_admin WITH LOGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;
