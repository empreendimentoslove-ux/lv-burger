import mysql from 'mysql2/promise';
import fs from 'fs';

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  const url = new URL(dbUrl);
  
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: url.port || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: {
      rejectUnauthorized: false
    },
  });

  try {
    const sql = fs.readFileSync('./drizzle/0007_slim_lucky_pierre.sql', 'utf8');
    await connection.query(sql);
    console.log('✅ Migration executed successfully');
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('✅ Table already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await connection.end();
  }
}

migrate();
