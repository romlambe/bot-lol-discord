import Database from 'better-sqlite3';
import path from 'path';


/* MaJ - RAM usage:

SQLITE3: db { 
memory: choose stockage,
pragma { 
  cache_size: cache limite,
  temp_store: temporary table on file,
  mmap_size: memory_mapping,
  page_size: page size reduction },
} */

const dbName = process.env.ENVIRONMENT;
const dbPath = process.env.DB_PATH || path.join(__dirname, `../../data/bot-lol-${dbName}.db`);

const db = new Database(dbPath, {
  memory: false,
  fileMustExist: false,
  timeout: 5000
});

db.pragma('cache_size = -2000');
db.pragma('temp_store = FILE');
db.pragma('mmap_size = 0');
db.pragma('page_size = 1024'); 

db.exec(`
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pandascore_id INTEGER UNIQUE,
  name TEXT,
  begin_at TEXT,
  status TEXT,
  tournament TEXT,
  team1 TEXT,
  team2 TEXT,
  bo_count INTEGER,
  score_team1 INTEGER DEFAULT 0,
  score_team2 INTEGER DEFAULT 0,
  announced INTEGER DEFAULT 0,
  votes_closed INTEGER DEFAULT 0,
  point_calculated INTEGER DEFAULT 0,
  result_announced INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT UNIQUE,
    username TEXT,
    points INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  match_id INTEGER,
  predicted_winner TEXT,
  predicted_score TEXT,
  points INTEGER DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(match_id) REFERENCES matches(pandascore_id),
  UNIQUE(user_id, match_id)
);
`);

console.log("\x1b[32m%s\x1b[0m", '[SUCCESS]: Database created successfully');

export default db;
