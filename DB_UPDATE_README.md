# Database Update Script: Party Classes Migration

This script updates your Supabase database to match the new required party classes for the flexible party creation feature.

## 🎯 What This Script Does

Updates the party system database to use the **required 5 classes**:
- **Barbarian** (replaces Warrior)
- **Mage** (updated specifications) 
- **Priest** (replaces Cleric)
- **Rogue** (updated specifications)
- **Bard** (new class)

## 📋 Prerequisites

1. **Initial Setup**: You must have already run the base migrations:
   - `migrate-story-data.sql` (main database setup)
   - `party-system-migration.sql` (party system tables)

2. **Database Access**: Supabase project with SQL Editor access

3. **Backup Recommendation**: While the script creates automatic backups, consider taking a manual snapshot of your database first

## 🚀 How to Run

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**

### Step 2: Execute the Update Script
1. Open `scripts/update-party-classes.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **"Run"** to execute

### Step 3: Verify the Migration
The script automatically displays verification results showing:
- Migration summary
- Available classes  
- Backup information
- Current class definitions
- Any migrated party members

Expected output:
```
Migration Summary: Updated party classes to required specifications
Classes Available: Barbarian, Bard, Mage, Priest, Rogue
Total Active Classes: 5
```

## 🔄 Migration Logic

### Class Mappings
The script safely migrates existing data using these mappings:

| Old Class | New Class | Migration Notes |
|-----------|-----------|-----------------|
| Warrior   | Barbarian | Direct replacement with similar stats |
| Cleric    | Priest    | Direct replacement with enhanced abilities |
| Ranger    | Rogue     | Closest equivalent, marked in custom_attributes |
| Mage      | Mage      | Updated to exact specifications |
| Rogue     | Rogue     | Updated to exact specifications |

### Data Safety Features
- **Automatic Backup**: Creates `party_migration_backup` table before any changes
- **Preservation**: Existing party members keep their names, levels, and custom attributes
- **Migration Tracking**: Migrated members get special notes in `custom_attributes`
- **No Data Loss**: All existing party configurations remain functional

## 📊 New Class Specifications

### Barbarian
```json
{
  "abilities": ["Rage", "Reckless Attack", "Danger Sense"],
  "baseStats": {
    "strength": 17, "dexterity": 13, "intelligence": 8,
    "wisdom": 12, "charisma": 10, "constitution": 16
  }
}
```

### Mage  
```json
{
  "abilities": ["Fireball", "Magic Shield", "Teleport"],
  "baseStats": {
    "strength": 8, "dexterity": 11, "intelligence": 17,
    "wisdom": 14, "charisma": 12, "constitution": 10
  }
}
```

### Priest
```json
{
  "abilities": ["Heal", "Bless", "Divine Protection"],
  "baseStats": {
    "strength": 12, "dexterity": 10, "intelligence": 13,
    "wisdom": 16, "charisma": 15, "constitution": 14
  }
}
```

### Rogue
```json
{
  "abilities": ["Sneak Attack", "Lockpicking", "Poison Strike"],
  "baseStats": {
    "strength": 12, "dexterity": 17, "intelligence": 13,
    "wisdom": 12, "charisma": 14, "constitution": 11
  }
}
```

### Bard
```json
{
  "abilities": ["Inspiration", "Charm Person", "Healing Song"],
  "baseStats": {
    "strength": 10, "dexterity": 14, "intelligence": 13,
    "wisdom": 12, "charisma": 17, "constitution": 12
  }
}
```

## 🔍 Verification Queries

After running the script, you can manually verify the migration:

```sql
-- Check available classes
SELECT id, name, description FROM party_member_classes WHERE is_active = true ORDER BY name;

-- Check migrated party members  
SELECT 
  pm.name as member_name,
  pmc.name as class_name,
  pm.custom_attributes
FROM party_members pm
JOIN party_member_classes pmc ON pm.class_id = pmc.id;

-- View backup data
SELECT * FROM party_migration_backup;
```

## 🎮 Application Impact

### Immediate Benefits
- ✅ **Full Compatibility**: Application now works with database seamlessly
- ✅ **Required Classes**: All 5 classes (Barbarian, Mage, Priest, Rogue, Bard) available
- ✅ **Enhanced Abilities**: Updated class abilities and balanced stats  
- ✅ **Preserved Data**: Existing parties continue to work normally

### User Experience
- **Existing Players**: Can continue with their current parties
- **New Players**: Get the full selection of required classes
- **Class Variety**: More diverse party compositions possible
- **Balanced Gameplay**: Updated stats provide better game balance

## 🛠️ Troubleshooting

### Script Execution Errors

**Error**: "relation 'party_member_classes' does not exist"
- **Solution**: Run `party-system-migration.sql` first

**Error**: "permission denied"  
- **Solution**: Ensure you have database modification permissions in Supabase

### Data Verification Issues

**Missing Classes**: If some classes don't appear
```sql
-- Check for inactive classes
SELECT * FROM party_member_classes WHERE is_active = false;
```

**Unexpected Mappings**: If party members have wrong classes
```sql
-- View migration backup to restore if needed
SELECT * FROM party_migration_backup WHERE old_class_name = 'OriginalClassName';
```

## 📈 Performance Impact

- **Minimal Impact**: Script runs quickly (typically < 5 seconds)
- **Optimized Queries**: Uses efficient UPSERT operations
- **Index Preservation**: All existing indexes remain intact
- **No Downtime**: Application continues to work during migration

## 🔙 Rollback (If Needed)

If you need to rollback the migration:

```sql
-- View what was changed
SELECT * FROM party_migration_backup;

-- Restore original classes (example)
INSERT INTO party_member_classes (id, name, description, abilities, base_stats, is_active)
VALUES ('warrior', 'Warrior', '...', '...', '...', true);

-- Restore party member assignments
UPDATE party_members pm
SET class_id = b.old_class_id
FROM party_migration_backup b
WHERE pm.id = b.member_id;
```

## ✅ Post-Migration Checklist

- [ ] Script executed successfully without errors
- [ ] Verification queries show 5 active classes
- [ ] Application loads party creation page correctly
- [ ] Can create new parties with all 5 classes
- [ ] Existing party data remains intact
- [ ] Backup table `party_migration_backup` contains expected records

## 🚀 Next Steps

After successful migration:

1. **Test the Application**: Create a new party to verify all classes work
2. **User Communication**: Notify users of the enhanced class system
3. **Monitor Performance**: Check that party creation remains fast
4. **Cleanup**: Consider removing `party_migration_backup` after confirming stability

The migration is now complete! Your database supports the full flexible party creation feature with all required classes.