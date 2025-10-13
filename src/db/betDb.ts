import db from './initDb';
import { Colors } from '../interface/color';

// BET

    // UPDATE

export function createOrUpdateBet(userId: number, matchId: number, predictedWinner: string, predictedBoCount: number) {
  const stmt = db.prepare(`
    INSERT INTO bets (user_id, match_id, predicted_winner, predicted_bo_count)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, match_id) DO UPDATE SET
      predicted_winner = excluded.predicted_winner,
      predicted_bo_count = excluded.predicted_bo_count
  `);
  stmt.run(userId, matchId, predictedWinner, predictedBoCount);
  console.log(`${Colors.Blue}[DB]: Bet placed or updated for user ${userId} on match ${matchId}`);
}

export function updateBetPoints(betId: number, points: number) {
  const stmt = db.prepare(`UPDATE bets SET points = ? WHERE id = ?`);
  stmt.run(points, betId);
  console.log(`${Colors.Green}[DB]: Bet ${betId} points updated → ${points}`);
}

    // GETTERS

export function getUserBets(userId: number) {
  return db.prepare(`SELECT * FROM bets WHERE user_id = ?`).all(userId);
}

export function getMatchBets(matchId: number) {
  return db.prepare(`
    SELECT 
      b.id AS bet_id,
      u.username,
      u.discord_id,
      b.predicted_winner,
      b.predicted_bo_count,
      b.points
    FROM bets b
    JOIN users u ON u.id = b.user_id
    WHERE b.match_id = ?
  `).all(matchId);
}

export function getAllBets() {
  return db.prepare(`SELECT * FROM bets`).all();
}