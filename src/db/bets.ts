import db from './initDb';
import { Colors } from '../interface/color';

// ========================
// CRUD OPERATIONS
// ========================

export function insertBet(userId: number, matchId: number, predictedWinner: string, predictedScore?: string) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO bets (user_id, match_id, predicted_winner, predicted_score, points)
    VALUES (?, ?, ?, ?, 0)
  `);
  return stmt.run(userId, matchId, predictedWinner, predictedScore || null);
}

export function getBetById(id: number) {
  return db.prepare('SELECT * FROM bets WHERE id = ?').get(id);
}

export function getBetByUserAndMatch(userId: number, matchId: number) {
  return db.prepare('SELECT * FROM bets WHERE user_id = ? AND match_id = ?').get(userId, matchId);
}

export function getAllBets() {
  return db.prepare('SELECT * FROM bets').all();
}

export function deleteBet(userId: number, matchId: number) {
  return db.prepare('DELETE FROM bets WHERE user_id = ? AND match_id = ?').run(userId, matchId);
}

// ========================
// FIELD UPDATES
// ========================

export function updateBetPredictedWinner(userId: number, matchId: number, predictedWinner: string) {
  const stmt = db.prepare('UPDATE bets SET predicted_winner = ? WHERE user_id = ? AND match_id = ?');
  return stmt.run(predictedWinner, userId, matchId);
}

export function updateBetPredictedScore(userId: number, matchId: number, predictedScore: string) {
  const stmt = db.prepare('UPDATE bets SET predicted_score = ? WHERE user_id = ? AND match_id = ?');
  return stmt.run(predictedScore, userId, matchId);
}

export function updateBetPoints(userId: number, matchId: number, points: number) {
  const stmt = db.prepare('UPDATE bets SET points = ? WHERE user_id = ? AND match_id = ?');
  return stmt.run(points, userId, matchId);
}

// ========================
// BET MANAGEMENT
// ========================

export function placeBet(discordId: string, matchId: number, predictedWinner: string, predictedScore?: string) {
  // Récupère l'ID utilisateur
  const user = db.prepare('SELECT id FROM users WHERE discord_id = ?').get(discordId);
  if (!user) {
    throw new Error('User not found');
  }
  
  return insertBet(user.id, matchId, predictedWinner, predictedScore);
}

export function updateBet(discordId: string, matchId: number, predictedWinner: string, predictedScore?: string) {
  const user = db.prepare('SELECT id FROM users WHERE discord_id = ?').get(discordId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const stmt = db.prepare(`
    UPDATE bets 
    SET predicted_winner = ?, predicted_score = ?
    WHERE user_id = ? AND match_id = ?
  `);
  return stmt.run(predictedWinner, predictedScore || null, user.id, matchId);
}

// ========================
// QUERY HELPERS
// ========================

export function getUserBets(discordId: string) {
  return db.prepare(`
    SELECT b.*, m.name as match_name, m.team1, m.team2, m.begin_at, m.status
    FROM bets b
    JOIN users u ON b.user_id = u.id
    JOIN matches m ON b.match_id = m.pandascore_id
    WHERE u.discord_id = ?
    ORDER BY m.begin_at ASC
  `).all(discordId);
}

export function getBetsForMatch(matchId: number) {
  return db.prepare(`
    SELECT b.*, u.username, u.discord_id
    FROM bets b
    JOIN users u ON b.user_id = u.id
    WHERE b.match_id = ?
  `).all(matchId);
}

export function getActiveBets(discordId: string) {
  return db.prepare(`
    SELECT b.*, m.name as match_name, m.team1, m.team2, m.begin_at
    FROM bets b
    JOIN users u ON b.user_id = u.id
    JOIN matches m ON b.match_id = m.pandascore_id
    WHERE u.discord_id = ? 
    AND m.status = 'not_started'
    AND datetime(m.begin_at) > datetime('now')
    ORDER BY m.begin_at ASC
  `).all(discordId);
}

export function getWinningBets(matchId: number) {
  return db.prepare(`
    SELECT b.*, u.username, u.discord_id, m.team1, m.team2, m.score_team1, m.score_team2
    FROM bets b
    JOIN users u ON b.user_id = u.id
    JOIN matches m ON b.match_id = m.pandascore_id
    WHERE b.match_id = ?
    AND (
      (m.score_team1 > m.score_team2 AND b.predicted_winner = 'team1') OR
      (m.score_team2 > m.score_team1 AND b.predicted_winner = 'team2')
    )
  `).all(matchId);
}

export function getTotalBetsForMatch(matchId: number) {
  const result = db.prepare('SELECT COUNT(*) as count FROM bets WHERE match_id = ?').get(matchId) as { count: number };
  return result.count;
}

export function getUserBetStats(discordId: string) {
  return db.prepare(`
    SELECT 
      COUNT(*) as total_bets,
      COUNT(CASE WHEN points > 0 THEN 1 END) as winning_bets,
      SUM(points) as total_points,
      AVG(points) as average_points
    FROM bets b
    JOIN users u ON b.user_id = u.id
    WHERE u.discord_id = ?
  `).get(discordId);
}

// ========================
// POINTS CALCULATION
// ========================

export function calculateAndDistributePoints(matchId: number) {
  const winningBets = getWinningBets(matchId);
  const totalBets = getTotalBetsForMatch(matchId);
  
  if (winningBets.length === 0) {
    console.log(`${Colors.Yellow}[BETS]: No winning bets for match ${matchId}${Colors.Reset}`);
    return;
  }
  
  // Points de base : 10 points par pari gagnant
  const basePoints = 10;
  // Bonus basé sur le nombre total de parieurs
  const bonusPoints = Math.floor(totalBets / winningBets.length);
  const pointsPerWinner = basePoints + bonusPoints;
  
  console.log(`${Colors.Blue}[BETS]: Distributing ${pointsPerWinner} points to ${winningBets.length} winners${Colors.Reset}`);
  
  const transaction = db.transaction(() => {
    winningBets.forEach((bet: any) => {
      // Met à jour les points du pari
      updateBetPoints(bet.user_id, matchId, pointsPerWinner);
      
      // Ajoute les points à l'utilisateur
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pointsPerWinner, bet.user_id);
    });
  });
  
  transaction();
  
  return {
    winnersCount: winningBets.length,
    pointsPerWinner,
    totalBets
  };
}