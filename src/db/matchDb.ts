import db from './initDb';
import { Match } from '../interface/match';
import { Colors } from '../interface/color';

// MATCHES

  // UPDATE

export function insertMatch(match: Match) {
  const team1 = match.opponents[0].opponent.acronym;
  const team2 = match.opponents[1].opponent.acronym;

  const score1 = match.results.find(each => each.team_id === match.opponents[0].opponent.id)?.score ?? 0;
  const score2 = match.results.find(each => each.team_id === match.opponents[1].opponent.id)?.score ?? 0;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO matches (
      pandascore_id,
      name,
      begin_at,
      status,
      tournament,
      team1,
      team2,
      bo_count,
      score_team1,
      score_team2
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insert.run(
    match.id,
    match.name,
    match.begin_at,
    match.status,
    match.tournament?.name ?? '',
    team1,
    team2,
    match.number_of_games,
    score1,
    score2
  );

  const update = db.prepare(`
    UPDATE matches SET
      name = ?,
      begin_at = ?,
      status = ?,
      tournament = ?,
      team1 = ?,
      team2 = ?,
      bo_count = ?,
      score_team1 = ?,
      score_team2 = ?
    WHERE pandascore_id = ? AND (
      name != ? OR begin_at != ? OR status != ? OR tournament != ? OR team1 != ? OR team2 != ? OR
      bo_count != ? OR score_team1 != ? OR score_team2 != ?
    )
  `);

  const result = update.run(
    match.name,
    match.begin_at,
    match.status,
    match.tournament?.name ?? '',
    team1,
    team2,
    match.number_of_games,
    score1,
    score2,
    match.id,
    match.name,
    match.begin_at,
    match.status,
    match.tournament?.name ?? '',
    team1,
    team2,
    match.number_of_games,
    score1,
    score2
  );

  if (result.changes > 0) {
    console.log(`${Colors.Blue}[DB]: Match updated in DB: ${match.name} (${team1} vs ${team2})`);
  } else {
    console.log(`${Colors.Orange}[DB]: No change for match: ${match.name} (${team1} vs ${team2})`);
  }
}

export function updateMatches(matches: Match[]) {
  console.log(`${Colors.Yellow}[LOG]: Updating database`);

  const confirmedMatches = matches.filter(each => {
    const hasValidTeams =
      each.opponents.length === 2 ;

    const isWorldsMatch =
      each.league?.name === 'Worlds' ||
      each.serie?.slug === 'league-of-legends-world-championship-2025' ||
      each.serie?.slug === 'league-of-legends-world-championship-2025-playoffs';

    return hasValidTeams && isWorldsMatch;
  });

  console.log(`${Colors.Blue}[LOG]: Found ${confirmedMatches.length} Worlds 2025 matches to insert.`);
  confirmedMatches.forEach(insertMatch);
}
  // GETTERS

export function getMatchById(pandascoreId: number) {
  return db.prepare(`SELECT * FROM matches WHERE pandascore_id = ?`).get(pandascoreId);
}

export function getCurrentMatch() {
  return db
    .prepare(`
      SELECT *
      FROM matches
      WHERE status = 'running'
         OR status = 'in_progress'
      ORDER BY datetime(begin_at) DESC
      LIMIT 1
    `)
    .get();
}

export function getNextMatches(limit = 5) {
  return db
    .prepare(`
      SELECT * FROM matches
      WHERE
        (
          datetime(begin_at) >= datetime('now')
          OR status = 'running'
          OR status = 'in_progress'
        )
      ORDER BY
        CASE
          WHEN status IN ('running', 'in_progress') THEN 0
          ELSE 1
        END,
        datetime(begin_at) ASC
      LIMIT ?
    `)
    .all(limit);
}

export function getBetsForMatch(matchId: number) {
  return db
    .prepare(`
      SELECT * FROM bets
      WHERE match_id = ?
    `)
    .all(matchId);
}

export function getMatchNotStarted() {
	return db
		.prepare(`
			SELECT * FROM matches
			WHERE status = 'not_started'
				AND datetime(begin_at) >= datetime('now')
				AND team1 != 'TBD'
				AND team2 != 'TBD'
		`)
		.all();
}


export function updateMatchAnnounced(matchId: number){
	const stmt = db.prepare(`
		UPDATE matches
		SET announced = 1
		WHERE id = ?
	`)
	stmt.run(matchId);
	console.log(`${Colors.Green}[DB]: Match ${matchId} marked as announced`);
}

export function updateMatchVotesClosed(matchId: number){
	const stmt = db.prepare(`
		UPDATE matches
		SET votes_closed = 1
		WHERE id = ?
	`)
	stmt.run(matchId);
	console.log(`${Colors.Green}[DB]: Match ${matchId} marked as votes closed`);
}
