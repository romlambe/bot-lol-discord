import Database from 'better-sqlite3';
import { Colors } from '../interface/color';

export function createTables(db: Database.Database) {
  console.log(`${Colors.Blue}[DB]: Database tables created successfully!`);
  
  db.exec(`
    CREATE TABLE matches (
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
      result_announced INTEGER DEFAULT 0,
      announced_24h INTEGER DEFAULT 0,
      announced_1h INTEGER DEFAULT 0,
      announced_10min INTEGER DEFAULT 0,
      announced_1min INTEGER DEFAULT 0,
      score_updates INTEGER DEFAULT 0
    );

    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT UNIQUE,
        username TEXT,
        points INTEGER DEFAULT 0
    );

    CREATE TABLE bets (
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

  createIndexes(db);
  console.log(`${Colors.Green}[DB]: Tables created successfully!`);
}

function createIndexes(db: Database.Database) {
  console.log(`${Colors.Blue}[DB]: Creating indexes...`);
  
  const indexes = [
    'CREATE INDEX idx_matches_begin_at ON matches(begin_at)',
    'CREATE INDEX idx_matches_status ON matches(status)', 
    'CREATE INDEX idx_matches_pandascore_id ON matches(pandascore_id)',
    'CREATE INDEX idx_bets_user_match ON bets(user_id, match_id)'
  ];
  
  indexes.forEach(indexSQL => {
    db.exec(indexSQL);
  });
  
  console.log(`${Colors.Green}[DB]: Tables indexed successfully!`);
}