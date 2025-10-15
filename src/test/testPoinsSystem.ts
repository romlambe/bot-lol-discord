import db from '../db/initDb';
import { processMatchResults } from '../bot/utils/processMatchResults';
import { getFinishedMatches, markPointsCalculated } from '../db/matchDb';
import { Colors } from '../interface/color';

console.log(`${Colors.Cyan}=== TEST : POINTS CALCULÉS UNE SEULE FOIS ===${Colors.Reset}\n`);

// 1. Nettoyer et préparer les données
console.log(`${Colors.Yellow}🧹 Nettoyage...${Colors.Reset}`);
db.prepare(`DELETE FROM matches WHERE pandascore_id = 777777`).run();
db.prepare(`DELETE FROM users WHERE discord_id LIKE 'test_%'`).run();
db.prepare(`DELETE FROM bets WHERE match_id = 777777`).run();

// 2. Créer un match terminé
console.log(`${Colors.Yellow}📊 Création d'un match terminé...${Colors.Reset}`);
const matchId = 777777;

db.prepare(`
  INSERT INTO matches (
    pandascore_id, name, begin_at, status, tournament,
    team1, team2, bo_count, score_team1, score_team2,
    announced, votes_closed, point_calculated
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  matchId,
  'TEST - T1 vs G2',
  new Date().toISOString(),
  'finished',  // ✅ Match terminé
  'Test Tournament',
  'T1',
  'G2',
  5,
  3,  // T1 gagne 3-1
  1,
  1,
  1,
  0   // ⚠️ Points PAS ENCORE calculés
);

console.log(`${Colors.Green}✅ Match créé: T1 vs G2 (Score final: 3-1, T1 gagne)${Colors.Reset}\n`);

// 3. Créer un utilisateur de test
console.log(`${Colors.Yellow}👤 Création d'un utilisateur...${Colors.Reset}`);
db.prepare(`
  INSERT INTO users (discord_id, username, points)
  VALUES (?, ?, ?)
`).run('test_alice', 'Alice', 0);

const user = db.prepare(`SELECT * FROM users WHERE discord_id = ?`).get('test_alice') as any;
console.log(`${Colors.Green}✅ Utilisateur créé: ${user.username} (Points initiaux: ${user.points})${Colors.Reset}\n`);

// 4. Créer un pari PARFAIT
console.log(`${Colors.Yellow}🎯 Création d'un pari...${Colors.Reset}`);
db.prepare(`
  INSERT INTO bets (user_id, match_id, predicted_winner, predicted_score, points)
  VALUES (?, ?, ?, ?, ?)
`).run(user.id, matchId, 'T1', '3-1', 0);

console.log(`${Colors.Green}✅ Pari créé: Alice prédit T1 en 3-1 (prédiction parfaite !)${Colors.Reset}\n`);

// 5. PREMIER CALCUL - Simuler le premier interval
console.log(`${Colors.Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Colors.Reset}`);
console.log(`${Colors.Cyan}📌 PREMIER INTERVAL (Simulation)${Colors.Reset}`);
console.log(`${Colors.Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Colors.Reset}\n`);

let finishedMatches = getFinishedMatches();
console.log(`${Colors.Yellow}🔍 Matchs terminés trouvés: ${finishedMatches.length}${Colors.Reset}`);

if (finishedMatches.length > 0) {
  const match = finishedMatches[0] as any;
  console.log(`   - Match ${match.pandascore_id}: ${match.name}`);
  console.log(`   - point_calculated: ${match.point_calculated}\n`);

  console.log(`${Colors.Green}⚡ Calcul des points...${Colors.Reset}`);
  processMatchResults(matchId);
  markPointsCalculated(matchId);
}

// Vérifier les points après le premier calcul
const userAfter1 = db.prepare(`SELECT * FROM users WHERE discord_id = ?`).get('test_alice') as any;
const betAfter1 = db.prepare(`SELECT * FROM bets WHERE match_id = ?`).get(matchId) as any;
const matchAfter1 = db.prepare(`SELECT * FROM matches WHERE pandascore_id = ?`).get(matchId) as any;

console.log(`\n${Colors.Green}✅ Résultats après le PREMIER calcul:${Colors.Reset}`);
console.log(`   - Points d'Alice: ${userAfter1.points} (était 0)`);
console.log(`   - Points du pari: ${betAfter1.points}`);
console.log(`   - point_calculated du match: ${matchAfter1.point_calculated}\n`);

// 6. DEUXIÈME CALCUL - Simuler le deuxième interval (10 secondes plus tard)
console.log(`${Colors.Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Colors.Reset}`);
console.log(`${Colors.Cyan}📌 DEUXIÈME INTERVAL (Simulation)${Colors.Reset}`);
console.log(`${Colors.Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Colors.Reset}\n`);

finishedMatches = getFinishedMatches();
console.log(`${Colors.Yellow}🔍 Matchs terminés trouvés: ${finishedMatches.length}${Colors.Reset}`);

if (finishedMatches.length > 0) {
  console.log(`${Colors.Red}❌ PROBLÈME ! Le match est encore trouvé alors qu'il a déjà été traité !${Colors.Reset}\n`);
  processMatchResults(matchId);
  markPointsCalculated(matchId);
} else {
  console.log(`${Colors.Green}✅ PARFAIT ! Le match n'est plus trouvé (déjà traité)${Colors.Reset}\n`);
}

// Vérifier les points après le deuxième calcul
const userAfter2 = db.prepare(`SELECT * FROM users WHERE discord_id = ?`).get('test_alice') as any;
const betAfter2 = db.prepare(`SELECT * FROM bets WHERE match_id = ?`).get(matchId) as any;

console.log(`${Colors.Green}✅ Résultats après le DEUXIÈME calcul:${Colors.Reset}`);
console.log(`   - Points d'Alice: ${userAfter2.points} (était ${userAfter1.points})`);
console.log(`   - Points du pari: ${betAfter2.points}\n`);

// 7. RÉSUMÉ FINAL
console.log(`${Colors.Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Colors.Reset}`);
console.log(`${Colors.Cyan}🎯 RÉSUMÉ FINAL${Colors.Reset}`);
console.log(`${Colors.Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Colors.Reset}\n`);

const expectedPoints = 35; // Gagnant correct (10) + Score exact (25)

if (userAfter1.points === expectedPoints && userAfter2.points === expectedPoints) {
  console.log(`${Colors.Green}✅ ✅ ✅ TEST RÉUSSI ! ✅ ✅ ✅${Colors.Reset}`);
  console.log(`\n${Colors.Green}Les points ont été calculés UNE SEULE FOIS :${Colors.Reset}`);
  console.log(`   - Points attendus: ${expectedPoints}`);
  console.log(`   - Points obtenus: ${userAfter2.points}`);
  console.log(`   - Premier calcul: +${userAfter1.points} points ✅`);
  console.log(`   - Deuxième calcul: +${userAfter2.points - userAfter1.points} points ✅`);
} else if (userAfter2.points > userAfter1.points) {
  console.log(`${Colors.Red}❌ ❌ ❌ TEST ÉCHOUÉ ! ❌ ❌ ❌${Colors.Reset}`);
  console.log(`\n${Colors.Red}Les points ont été calculés PLUSIEURS FOIS :${Colors.Reset}`);
  console.log(`   - Après premier calcul: ${userAfter1.points} points`);
  console.log(`   - Après deuxième calcul: ${userAfter2.points} points`);
  console.log(`   - Différence: +${userAfter2.points - userAfter1.points} points (devrait être 0 !)`);
} else {
  console.log(`${Colors.Yellow}⚠️ Résultat inattendu${Colors.Reset}`);
  console.log(`   - Points après 1er calcul: ${userAfter1.points}`);
  console.log(`   - Points après 2ème calcul: ${userAfter2.points}`);
}

console.log(`\n${Colors.Green}🎉 Test terminé !${Colors.Reset}\n`);
