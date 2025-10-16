import db from '../db/initDb';
import { Colors } from '../interface/color';

function createTestMatch(minutesFromNow: number = 12) {

	const now = new Date();
	const matchDate = new Date(now.getTime() + minutesFromNow * 60000);

	const stmt = db.prepare(`
		INSERT INTO matches (
		  pandascore_id,
		  name,
		  begin_at,
		  status,
		  tournament,
		  team1,
		  team2,
		  bo_count,
		  score_team1,
		  score_team2,
		  announced,
		  votes_closed
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	  `);

	  const result = stmt.run(
		999999,  // ID fictif unique
		'TEST MATCH - T1 vs G2',
		matchDate.toISOString(),
		'not_started',
		'Test Tournament',
		'T1',
		'G2',
		5,  // BO5
		0,
		0,
		0,  // not announced
		0   // votes not closed
	  );
	  console.log(`${Colors.Green}[TEST]: Match de test créé !${Colors.Reset}`);
	  console.log(`${Colors.Yellow}[TEST]: Le match commencera à ${matchDate.toLocaleString('fr-FR')}${Colors.Reset}`);
	  console.log(`${Colors.Yellow}[TEST]: Dans ${minutesFromNow} minutes${Colors.Reset}`);
}

createTestMatch(12);
