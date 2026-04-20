import mysql from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(dbUrl);

try {
  console.log('Executing migration...');
  
  // Create company_info table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`company_info\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`name\` varchar(200) NOT NULL DEFAULT 'LV BURGER',
      \`logoUrl\` text,
      \`description\` text,
      \`phone\` varchar(20),
      \`email\` varchar(320),
      \`address\` text,
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`company_info_id\` PRIMARY KEY(\`id\`)
    )
  `);
  console.log('✓ company_info table created');

  // Create promotions table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`promotions\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`title\` varchar(200) NOT NULL,
      \`description\` text NOT NULL,
      \`imageUrl\` text,
      \`discountPercentage\` int,
      \`discountValue\` decimal(10,2),
      \`startDate\` timestamp NOT NULL,
      \`endDate\` timestamp NOT NULL,
      \`isActive\` boolean NOT NULL DEFAULT true,
      \`sortOrder\` int NOT NULL DEFAULT 0,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`promotions_id\` PRIMARY KEY(\`id\`)
    )
  `);
  console.log('✓ promotions table created');

  // Insert default company info
  await connection.execute(`
    INSERT INTO company_info (name, description) 
    VALUES ('LV BURGER', 'Hamburgueria Artesanal Premium')
    ON DUPLICATE KEY UPDATE name = name
  `);
  console.log('✓ Default company info inserted');

  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
