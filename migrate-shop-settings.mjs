import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function migrate() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('Creating shop_settings table...');
    
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`shop_settings\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`isOpen\` boolean NOT NULL DEFAULT true,
        \`openTime\` varchar(5) NOT NULL DEFAULT '17:00',
        \`closeTime\` varchar(5) NOT NULL DEFAULT '00:00',
        \`operatingDays\` varchar(20) NOT NULL DEFAULT '1,2,3,4,5,6',
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`shop_settings_id\` PRIMARY KEY(\`id\`)
      )
    `);
    
    console.log('✓ shop_settings table created');
    
    // Insert default settings
    await conn.execute(`
      INSERT IGNORE INTO \`shop_settings\` (id, isOpen, openTime, closeTime, operatingDays) 
      VALUES (1, true, '17:00', '00:00', '1,2,3,4,5,6')
    `);
    
    console.log('✓ Default settings inserted');
    
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
