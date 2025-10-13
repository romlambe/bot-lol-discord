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
  const confirmedMatches = matches.filter(
    each =>
      each.opponents.length === 2 &&
      each.opponents[0].opponent.acronym !== 'TBD' &&
      each.opponents[1].opponent.acronym !== 'TBS'
  );
  confirmedMatches.forEach(insertMatch);
}

  // GETTERS

export function getMatchById(pandascoreId: number) {
  return db.prepare(`SELECT * FROM matches WHERE pandascore_id = ?`).get(pandascoreId);
}