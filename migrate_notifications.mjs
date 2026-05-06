import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL.split('@')[1].split(':')[0],
  user: process.env.DATABASE_URL.split('//')[1].split(':')[0],
  password: process.env.DATABASE_URL.split(':')[2].split('@')[0],
  database: process.env.DATABASE_URL.split('/').pop(),
  ssl: 'Amazon RDS',
});

const sql = `CREATE TABLE IF NOT EXISTS notifications (
  id int AUTO_INCREMENT NOT NULL,
  userId int NOT NULL,
  orderId int NOT NULL,
  type enum('new_order','order_status_change','delivery_accepted','delivery_completed') NOT NULL,
  title varchar(200) NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  createdAt timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT notifications_id PRIMARY KEY(id)
);`;

try {
  await connection.execute(sql);
  console.log('Notifications table created successfully');
} catch (error) {
  console.error('Migration error:', error.message);
}

await connection.end();
