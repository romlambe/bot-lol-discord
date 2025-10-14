import db from './initDb';
import { Colors } from '../interface/color';

// USER

    // UPDATE

export function upsertUser(discordId: string, username: string) {
  const stmt = db.prepare(`
    INSERT INTO users (discord_id, username)
    VALUES (?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET username = excluded.username
  `);
  stmt.run(discordId, username);
  console.log(`${Colors.Blue}[DB]: User upserted: ${username} (${discordId})`);
}

export function updateUserPoints(discordId: string, newPoints: number) {
  const stmt = db.prepare(`UPDATE users SET points = ? WHERE discord_id = ?`);
  stmt.run(newPoints, discordId);
  console.log(`${Colors.Green}[DB]: Points updated for ${discordId} → ${newPoints}`);
}

    // GETTERS

export function getUserByDiscordId(discordId: string) {
  return db.prepare(`SELECT * FROM users WHERE discord_id = ?`).get(discordId);
}

export function getAllUsers() {
  return db.prepare(`SELECT * FROM users`).all();
}

export function getUsersByPoints() {
  return db.prepare(`SELECT * FROM users ORDER BY points DESC`).all();
}
