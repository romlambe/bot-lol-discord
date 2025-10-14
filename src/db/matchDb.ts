import db from './initDb';
import { Match } from '../interface/match';
import { ApiMatch } from '../interface/apiMatch';
import { Colors } from '../interface/color';

// MATCHES

// UPDATE

export function insertMatch(match: Match) {
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
    match.pandascore_id,
    match.name,
    match.begin_at,
    match.status,
    match.tournament,
    match.team1,
    match.team2,
    match.bo_count,
    match.score_team1,
    match.score_team2
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
    match.tournament,
    match.team1,
    match.team2,
    match.bo_count,
    match.score_team1,
    match.score_team2,
    match.pandascore_id,
    match.name,
    match.begin_at,
    match.status,
    match.tournament,
    match.team1,
    match.team2,
    match.bo_count,
    match.score_team1,
    match.score_team2
  );

  if (result.changes > 0) {
    console.log(`${Colors.Blue}[DB]: Match updated in DB: ${match.name} (${match.team1} vs ${match.team2})`);
  } else {
    console.log(`${Colors.Orange}[DB]: No change for match: ${match.name} (${match.team1} vs ${match.team2})`);
  }
}

// Convertir les données de l'API vers le format BD
function convertApiMatchToDbMatch(apiMatch: ApiMatch): Match {
  const team1 = apiMatch.opponents[0]?.opponent.acronym ?? 'TBD';
  const team2 = apiMatch.opponents[1]?.opponent.acronym ?? 'TBD';

  const score1 = apiMatch.results.find(each => each.team_id === apiMatch.opponents[0]?.opponent.id)?.score ?? 0;
  const score2 = apiMatch.results.find(each => each.team_id === apiMatch.opponents[1]?.opponent.id)?.score ?? 0;

  return {
    id: 0, // sera généré par la BD
    pandascore_id: apiMatch.id,
    name: apiMatch.name,
    begin_at: apiMatch.begin_at,
    status: apiMatch.status,
    tournament: apiMatch.tournament?.name ?? '',
    team1,
    team2,
    bo_count: apiMatch.number_of_games,
    score_team1: score1,
    score_team2: score2,
    announced: 0,
    votes_closed: 0,
  };
}

// Filtrer les matchs Worlds comme dans le code Go
function isWorldsMatch(match: ApiMatch): boolean {
  return (
    match.league?.name === 'Worlds' ||
    match.serie?.slug === 'league-of-legends-world-championship-2025' ||
    match.serie?.slug === 'league-of-legends-world-championship-2025-playoffs'
  );
}

export function updateMatches(apiMatches: ApiMatch[]) {
  console.log(`${Colors.Yellow}[LOG]: Updating database`);

  const confirmedMatches = apiMatches.filter(each => {
    const hasValidTeams = each.opponents.length === 2;
    const isWorlds = isWorldsMatch(each);

    return hasValidTeams && isWorlds;
  });

  console.log(`${Colors.Blue}[LOG]: Found ${confirmedMatches.length} Worlds 2025 matches to insert.`);

  confirmedMatches.forEach(apiMatch => {
    const dbMatch = convertApiMatchToDbMatch(apiMatch);
    insertMatch(dbMatch);
  });
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

export function updateMatchAnnounced(matchId: number) {
  const stmt = db.prepare(`
    UPDATE matches
    SET announced = 1
    WHERE id = ?
  `);
  stmt.run(matchId);
  console.log(`${Colors.Green}[DB]: Match ${matchId} marked as announced`);
}

export function updateMatchVotesClosed(matchId: number) {
  const stmt = db.prepare(`
    UPDATE matches
    SET votes_closed = 1
    WHERE id = ?
  `);
  stmt.run(matchId);
  console.log(`${Colors.Green}[DB]: Match ${matchId} marked as votes closed`);
}

export function getMatchResults(matchId: number) {
	return db.prepare(`
		SELECT
			pandascore_id,
			name,
			team1,
			team2,
			score_team1,
			score_team2,
			status
		FROM matches
		WHERE pandascore_id = ?
	`).get(matchId);
}

export function updateMatchResults(matchId: number, status: string){
	const stmt = db.prepare(`
		UPDATE matches
		SET status = ?
		WHERE pandascore_id = ?
	`)
	stmt.run(status, matchId);
	console.log(`${Colors.Green}[DB]: Match ${matchId} results updated to ${status}`);
}


export function getFinishedMatches() {
	return db.prepare(`
		SELECT * FROM matches
		WHERE status = 'finished'
		AND pandascore_id IN (SELECT DISTINCT match_id FROM bets)
	`).all();
}
