-- Parties & Characters Rollback Migration Script for Supabase
-- This script safely removes the `parties` and `characters` tables
-- Run this script if you need to rollback the parties-characters-migration.sql
-- This script is idempotent and can be run multiple times safely

-- ====================
-- ROLLBACK CONFIRMATION
-- ====================

DO $$
BEGIN
  RAISE NOTICE 'Starting rollback of parties and characters tables...';
  RAISE NOTICE 'This will remove all data in the parties and characters tables.';
  RAISE NOTICE 'Make sure you have backed up any important data before proceeding.';
END $$;

-- ====================
-- DROP COMPATIBILITY VIEWS
-- ====================

-- Drop compatibility views that depend on the tables
DROP VIEW IF EXISTS party_configurations_compat CASCADE;
DROP VIEW IF EXISTS party_members_compat CASCADE;

-- ====================
-- DROP HELPER VIEWS
-- ====================

-- Drop helper views
DROP VIEW IF EXISTS parties_complete CASCADE;
DROP VIEW IF EXISTS parties_statistics CASCADE;
DROP VIEW IF EXISTS characters_attributes_extended CASCADE;

-- ====================
-- DROP HELPER FUNCTIONS
-- ====================

-- Drop helper functions
DROP FUNCTION IF EXISTS get_character_attribute_value(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_character_traits_list(TEXT) CASCADE;
DROP FUNCTION IF EXISTS validate_party_configuration(TEXT) CASCADE;

-- ====================
-- DROP TABLES
-- ====================

-- Drop characters table first (due to foreign key dependency)
DROP TABLE IF EXISTS characters CASCADE;

-- Drop parties table
DROP TABLE IF EXISTS parties CASCADE;

-- ====================
-- VERIFICATION
-- ====================

-- Verify the rollback
DO $$
DECLARE
  parties_exists BOOLEAN := false;
  characters_exists BOOLEAN := false;
BEGIN
  -- Check if tables still exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'parties'
  ) INTO parties_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'characters'
  ) INTO characters_exists;
  
  IF parties_exists OR characters_exists THEN
    RAISE EXCEPTION 'Rollback failed: Some tables still exist';
  ELSE
    RAISE NOTICE 'Rollback completed successfully:';
    RAISE NOTICE '- parties table: removed';
    RAISE NOTICE '- characters table: removed';
    RAISE NOTICE '- All helper views and functions: removed';
    RAISE NOTICE '- All indexes and constraints: removed';
    RAISE NOTICE '- All RLS policies: removed';
  END IF;
END $$;

-- ====================
-- CLEANUP VERIFICATION
-- ====================

-- Show that the tables are gone
SELECT 'Remaining tables in public schema' as info;
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('parties', 'characters', 'party_configurations', 'party_members', 'party_member_classes')
ORDER BY table_name;

-- Show that views are gone
SELECT 'Remaining views related to parties/characters' as info;
SELECT viewname 
FROM pg_views 
WHERE viewname LIKE '%part%' OR viewname LIKE '%character%'
ORDER BY viewname;

-- Show that functions are gone
SELECT 'Remaining functions related to parties/characters' as info;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%character%' OR routine_name LIKE '%part%')
ORDER BY routine_name;