// IMPORT
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// DB MANAGEMENT
import { createTables } from './createTables';

// CUSTOM
import { Colors } from '../interface/color';

/* MaJ - RAM usage:

SQLITE3: db { 
pragma { 
  cache_size: cache limite,
  temp_store: temporary table on file,
  mmap_size: memory_mapping,
  page_size: page size reduction },
} */

const dbName = process.env.ENVIRONMENT;
const dbPath = process.env.DB_PATH || path.join(__dirname, `../../data/bot-lol-${dbName}.db`);

// CHECK EXISTING DB
const dbExists = fs.existsSync(dbPath);

// CONNECT DB
const db = new Database(dbPath, {
  fileMustExist: false,
  timeout: 5000
});

// RAM USAGE 1
db.pragma('cache_size = -2000');
db.pragma('temp_store = FILE');
db.pragma('mmap_size = 0');
db.pragma('page_size = 1024');

// INIT
if (!dbExists) {
  console.log(`${Colors.Blue}[DB]: Database does not exist, creating...`);
  createTables(db);
  console.log(`${Colors.Green}[DB]: Database created successfully!`);
} else {
  console.log(`${Colors.Blue}[DB]: Database exist, continuing...`);
}

// DEBUG
const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get() as { count: number };
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
const betCount = db.prepare('SELECT COUNT(*) as count FROM bets').get() as { count: number };
console.log(`${Colors.Blue}[DB]: ${matchCount.count} matches, ${userCount.count} users, ${betCount.count} bets`);

export default db;