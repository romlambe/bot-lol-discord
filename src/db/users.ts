import db from './initDb';
import { Colors } from '../interface/color';

// ========================
// CRUD OPERATIONS
// ========================

export function insertUser(discordId: string, username: string) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (discord_id, username, points)
    VALUES (?, ?, 0)
  `);
  return stmt.run(discordId, username);
}

export function getUserById(id: number) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function getUserByDiscordId(discordId: string) {
  return db.prepare('SELECT * FROM users WHERE discord_id = ?').get(discordId);
}

export function getAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY points DESC').all();
}

export function deleteUser(discordId: string) {
  return db.prepare('DELETE FROM users WHERE discord_id = ?').run(discordId);
}

// ========================
// FIELD UPDATES
// ========================

export function updateUserUsername(discordId: string, username: string) {
  const stmt = db.prepare('UPDATE users SET username = ? WHERE discord_id = ?');
  return stmt.run(username, discordId);
}

export function updateUserPoints(discordId: string, points: number) {
  const stmt = db.prepare('UPDATE users SET points = ? WHERE discord_id = ?');
  return stmt.run(points, discordId);
}

// ========================
// POINTS MANAGEMENT
// ========================

export function addPoints(discordId: string, pointsToAdd: number) {
  const stmt = db.prepare('UPDATE users SET points = points + ? WHERE discord_id = ?');
  return stmt.run(pointsToAdd, discordId);
}

export function subtractPoints(discordId: string, pointsToSubtract: number) {
  const stmt = db.prepare('UPDATE users SET points = points - ? WHERE discord_id = ?');
  return stmt.run(pointsToSubtract, discordId);
}

export function resetUserPoints(discordId: string) {
  const stmt = db.prepare('UPDATE users SET points = 0 WHERE discord_id = ?');
  return stmt.run(discordId);
}

export function resetAllPoints() {
  const stmt = db.prepare('UPDATE users SET points = 0');
  return stmt.run();
}

// ========================
// QUERY HELPERS
// ========================

export function getLeaderboard(limit: number = 10) {
  return db.prepare(`
    SELECT discord_id, username, points, 
           ROW_NUMBER() OVER (ORDER BY points DESC) as rank
    FROM users 
    WHERE points > 0
    ORDER BY points DESC 
    LIMIT ?
  `).all(limit);
}

export function getUserRank(discordId: string) {
  const result = db.prepare(`
    SELECT rank FROM (
      SELECT discord_id, 
             ROW_NUMBER() OVER (ORDER BY points DESC) as rank
      FROM users 
      WHERE points > 0
    ) WHERE discord_id = ?
  `).get(discordId);
  
  return result ? (result as any).rank : null;
}

export function getUserStats(discordId: string) {
  return db.prepare(`
    SELECT u.*, 
           (SELECT COUNT(*) FROM bets WHERE user_id = u.id) as total_bets,
           (SELECT COUNT(*) FROM bets WHERE user_id = u.id AND points > 0) as winning_bets
    FROM users u
    WHERE u.discord_id = ?
  `).get(discordId);
}

export function getTotalUsers() {
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  return result.count;
}

// ========================
// USER UTILITIES
// ========================

export function createUserIfNotExists(discordId: string, username: string) {
  const existingUser = getUserByDiscordId(discordId);
  if (!existingUser) {
    insertUser(discordId, username);
    console.log(`${Colors.Green}[USER]: Created new user ${username} (${discordId})${Colors.Reset}`);
    return getUserByDiscordId(discordId);
  }
  
  // Met à jour le username si changé
  if (existingUser.username !== username) {
    updateUserUsername(discordId, username);
    console.log(`${Colors.Blue}[USER]: Updated username for ${discordId}: ${existingUser.username} -> ${username}${Colors.Reset}`);
  }
  
  return existingUser;
}