-- Database Check Script: Verify Party Classes Status
-- Run this script to check if you need to apply the party classes update
-- This helps determine if your database matches the current application requirements

-- Check current party member classes
SELECT 
  'Current Party Classes' as check_type,
  STRING_AGG(name, ', ' ORDER BY name) as result
FROM party_member_classes 
WHERE is_active = true
UNION ALL

-- Check if required classes exist
SELECT 
  'Required Classes Present',
  CASE 
    WHEN COUNT(*) = 5 AND 
         'barbarian' = ANY(ARRAY_AGG(id)) AND
         'mage' = ANY(ARRAY_AGG(id)) AND
         'priest' = ANY(ARRAY_AGG(id)) AND
         'rogue' = ANY(ARRAY_AGG(id)) AND
         'bard' = ANY(ARRAY_AGG(id))
    THEN '✅ All required classes present'
    ELSE '❌ Missing required classes - update needed'
  END as result
FROM party_member_classes 
WHERE is_active = true AND id IN ('barbarian', 'mage', 'priest', 'rogue', 'bard')
UNION ALL

-- Check for old classes that need migration
SELECT 
  'Old Classes Found',
  CASE 
    WHEN COUNT(*) > 0 
    THEN '⚠️ Found: ' || STRING_AGG(name, ', ') || ' - migration recommended'
    ELSE '✅ No old classes found'
  END as result
FROM party_member_classes 
WHERE is_active = true AND id IN ('warrior', 'cleric', 'ranger')
UNION ALL

-- Check total class count
SELECT 
  'Total Active Classes',
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ Correct count (5)'
    WHEN COUNT(*) < 5 THEN '❌ Too few (' || COUNT(*) || ') - missing classes'
    ELSE '⚠️ Too many (' || COUNT(*) || ') - cleanup needed'
  END as result
FROM party_member_classes 
WHERE is_active = true
UNION ALL

-- Check for existing party data
SELECT 
  'Existing Party Members',
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No existing data - safe to update'
    ELSE '⚠️ ' || COUNT(*) || ' members found - backup recommended'
  END as result
FROM party_members;

-- Detailed class information
SELECT 
  'DETAILED CLASS INFO' as section,
  '' as spacer;

SELECT 
  id,
  name,
  CASE 
    WHEN id IN ('barbarian', 'mage', 'priest', 'rogue', 'bard') THEN '✅ Required'
    WHEN id IN ('warrior', 'cleric', 'ranger') THEN '❌ Old/Deprecated'
    ELSE '❓ Unknown'
  END as status,
  JSON_ARRAY_LENGTH(abilities) as ability_count,
  created_at,
  updated_at
FROM party_member_classes 
WHERE is_active = true
ORDER BY 
  CASE 
    WHEN id IN ('barbarian', 'mage', 'priest', 'rogue', 'bard') THEN 1
    WHEN id IN ('warrior', 'cleric', 'ranger') THEN 2
    ELSE 3
  END,
  name;

-- Recommendations
SELECT 
  'RECOMMENDATIONS' as section,
  '' as spacer;

SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM party_member_classes 
      WHERE is_active = true AND id IN ('barbarian', 'mage', 'priest', 'rogue', 'bard')
    ) = 5 AND (
      SELECT COUNT(*) FROM party_member_classes 
      WHERE is_active = true AND id IN ('warrior', 'cleric', 'ranger')
    ) = 0
    THEN '🎉 Your database is up to date! No action needed.'
    
    WHEN (
      SELECT COUNT(*) FROM party_member_classes 
      WHERE is_active = true AND id IN ('warrior', 'cleric', 'ranger')
    ) > 0
    THEN '📋 Run update-party-classes.sql to migrate to new class system'
    
    WHEN (
      SELECT COUNT(*) FROM party_member_classes 
      WHERE is_active = true AND id IN ('barbarian', 'mage', 'priest', 'rogue', 'bard')
    ) < 5
    THEN '📋 Run update-party-classes.sql to add missing required classes'
    
    ELSE '📋 Consider running update-party-classes.sql to ensure latest class definitions'
  END as recommendation;