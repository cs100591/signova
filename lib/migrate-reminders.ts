import pool from './db';

/**
 * Database migration for expiry reminder system
 * Run this script to add reminder tracking columns to the contracts table
 */

async function migrate() {
  console.log('Starting expiry reminder migration...\n');

  try {
    // Check if columns already exist
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' 
      AND column_name IN ('reminder_90_sent', 'reminder_30_sent', 'reminder_7_sent', 'reminder_0_sent')
    `);

    const existingColumns = checkResult.rows.map(r => r.column_name);
    console.log('Existing columns:', existingColumns);

    // Add missing columns
    const alterStatements = [];
    
    if (!existingColumns.includes('reminder_90_sent')) {
      alterStatements.push('ADD COLUMN reminder_90_sent BOOLEAN DEFAULT false');
    }
    if (!existingColumns.includes('reminder_30_sent')) {
      alterStatements.push('ADD COLUMN reminder_30_sent BOOLEAN DEFAULT false');
    }
    if (!existingColumns.includes('reminder_7_sent')) {
      alterStatements.push('ADD COLUMN reminder_7_sent BOOLEAN DEFAULT false');
    }
    if (!existingColumns.includes('reminder_0_sent')) {
      alterStatements.push('ADD COLUMN reminder_0_sent BOOLEAN DEFAULT false');
    }

    if (alterStatements.length > 0) {
      const alterQuery = `ALTER TABLE contracts ${alterStatements.join(', ')}`;
      console.log('Executing:', alterQuery);
      await pool.query(alterQuery);
      console.log(`✅ Added ${alterStatements.length} new columns`);
    } else {
      console.log('✅ All columns already exist');
    }

    // Verify the migration
    const verifyResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'contracts' 
      AND column_name LIKE 'reminder_%'
    `);

    console.log('\n📊 Reminder columns in contracts table:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

export default migrate;
