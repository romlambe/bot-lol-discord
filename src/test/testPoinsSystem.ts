import db from '../db/initDb';
import { processMatchResults } from '../bot/utils/processMatchResults';
import { Colors } from '../interface/color';

// Clear tables for a clean test run
db.prepare('DELETE FROM bets').run();
db.prepare('DELETE FROM users').run();
db.prepare('DELETE FROM matches').run();


console.log(`${Colors.Cyan}=== TEST DU SYSTÈME DE POINTS ===${Colors.Reset}\n`);

// 1. Créer un match de test terminé
const matchId = 888888;
const insertMatch = db.prepare(`
  INSERT OR REPLACE INTO matches (
    pandascore_id, name, begin_at, status, tournament,
    team1, team2, bo_count, score_team1, score_team2
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertMatch.run(
  matchId,
  'TEST - T1 vs G2',
  new Date().toISOString(),
  'finished',  // ✅ Match terminé
  'Test Tournament',
  'T1',
  'G2',
  5,
  3,  // T1 gagne 3-1
  1
);

console.log(`${Colors.Green}✅ Match de test créé: T1 vs G2 (3-1, T1 gagne)${Colors.Reset}\n`);

// 2. Créer des utilisateurs de test
const users = [
  { discord_id: 'test_user_1', username: 'Alice' },
  { discord_id: 'test_user_2', username: 'Bob' },
  { discord_id: 'test_user_3', username: 'Charlie' },
];

users.forEach(user => {
  db.prepare(`
    INSERT OR REPLACE INTO users (discord_id, username, points)
    VALUES (?, ?, 0)
  `).run(user.discord_id, user.username);
});

console.log(`${Colors.Green}✅ 3 utilisateurs de test créés${Colors.Reset}\n`);

// 3. Créer des paris de test avec différents scénarios
const bets = [
  { user: 'Alice', winner: 'T1', score: 3, comment: 'Prédiction parfaite ✅' },
  { user: 'Bob', winner: 'T1', score: 1, comment: 'Bon gagnant, mauvais score' },
  { user: 'Charlie', winner: 'G2', score: 3, comment: 'Mauvais gagnant' },
];

bets.forEach((bet, index) => {
  const user = users.find(u => u.username === bet.user);
  const userId = db.prepare(`SELECT id FROM users WHERE discord_id = ?`).get(user!.discord_id) as any;

  db.prepare(`
    INSERT OR REPLACE INTO bets (user_id, match_id, predicted_winner, predicted_score, points)
    VALUES (?, ?, ?, ?, 0)
  `).run(userId.id, matchId, bet.winner, bet.score);

  console.log(`${Colors.Yellow}📊 Pari ${index + 1}: ${bet.user} → ${bet.winner} en ${bet.score} (${bet.comment})${Colors.Reset}`);
});

console.log(`\n${Colors.Cyan}--- AVANT LE CALCUL DES POINTS ---${Colors.Reset}`);
users.forEach(user => {
  const dbUser = db.prepare(`SELECT * FROM users WHERE discord_id = ?`).get(user.discord_id) as any;
  console.log(`${user.username}: ${dbUser.points} points`);
});

// 4. Exécuter le calcul des points
console.log(`\n${Colors.Cyan}=== EXÉCUTION DU CALCUL ===\n${Colors.Reset}`);
processMatchResults(matchId);

// 5. Afficher les résultats
console.log(`\n${Colors.Cyan}--- APRÈS LE CALCUL DES POINTS ---${Colors.Reset}`);
users.forEach(user => {
  const dbUser = db.prepare(`SELECT * FROM users WHERE discord_id = ?`).get(user.discord_id) as any;
  const bet = db.prepare(`
    SELECT b.*, u.username
    FROM bets b
    JOIN users u ON u.id = b.user_id
    WHERE u.discord_id = ? AND b.match_id = ?
  `).get(user.discord_id, matchId) as any;

  console.log(`${Colors.Green}${user.username}: ${dbUser.points} points (+${bet.points} pour ce match)${Colors.Reset}`);
});

// 6. Afficher le résumé
console.log(`\n${Colors.Cyan}=== RÉSUMÉ ===${Colors.Reset}`);
console.log(`Match: T1 vs G2, Score final: 3-1, Gagnant: T1`);
console.log(`\nRègles de points:`);
console.log(`- Gagnant correct: +10 points`);
console.log(`- Gagnant ET score corrects: +35 points (10 + 25)`);
console.log(`\nRésultats attendus:`);
console.log(`- Alice (T1 en 3): 35 points ✅`);
console.log(`- Bob (T1 en 2): 10 points ✅`);
console.log(`- Charlie (G2 en 3): 0 points ❌`);

console.log(`\n${Colors.Green}✅ Test terminé !${Colors.Reset}`);
