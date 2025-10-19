import Database from 'better-sqlite3';
import db from './initDb';
import { Match } from '../interface/match';
import { ApiMatch } from '../interface/apiMatch';
import { Colors } from '../interface/color';

// ========================
// CRUD OPERATIONS
// ========================

export function insertMatch(match: Match) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO matches (
      pandascore_id, name, begin_at, status, tournament,
      team1, team2, bo_count, score_team1, score_team2
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    match.pandascore_id, match.name, match.begin_at, match.status, match.tournament,
    match.team1, match.team2, match.bo_count, match.score_team1, match.score_team2
  );
}

export function getMatchById(pandascoreId: number) {
  return db.prepare('SELECT * FROM matches WHERE pandascore_id = ?').get(pandascoreId);
}

export function getAllMatches() {
  return db.prepare('SELECT * FROM matches ORDER BY begin_at ASC').all();
}

export function deleteMatch(pandascoreId: number) {
  return db.prepare('DELETE FROM matches WHERE pandascore_id = ?').run(pandascoreId);
}

export function getFinishedMatches() {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE status IN ('finished', 'closed') 
    AND point_calculated = 0
  `).all();
}

export function getFinishedMatchesNotAnnounced() {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE status IN ('finished', 'closed') 
    AND result_announced = 0
    AND point_calculated = 1
  `).all();
}

// ========================
// BASIC FIELD UPDATES
// ========================

export function updateMatchName(pandascoreId: number, name: string) {
  const stmt = db.prepare('UPDATE matches SET name = ? WHERE pandascore_id = ?');
  return stmt.run(name, pandascoreId);
}

export function updateMatchBeginAt(pandascoreId: number, beginAt: string) {
  const stmt = db.prepare('UPDATE matches SET begin_at = ? WHERE pandascore_id = ?');
  return stmt.run(beginAt, pandascoreId);
}

export function updateMatchStatus(pandascoreId: number, status: string) {
  const stmt = db.prepare('UPDATE matches SET status = ? WHERE pandascore_id = ?');
  return stmt.run(status, pandascoreId);
}

export function updateMatchTournament(pandascoreId: number, tournament: string) {
  const stmt = db.prepare('UPDATE matches SET tournament = ? WHERE pandascore_id = ?');
  return stmt.run(tournament, pandascoreId);
}

export function updateMatchTeams(pandascoreId: number, team1: string, team2: string) {
  const stmt = db.prepare('UPDATE matches SET team1 = ?, team2 = ? WHERE pandascore_id = ?');
  return stmt.run(team1, team2, pandascoreId);
}

export function updateMatchBoCount(pandascoreId: number, boCount: number) {
  const stmt = db.prepare('UPDATE matches SET bo_count = ? WHERE pandascore_id = ?');
  return stmt.run(boCount, pandascoreId);
}

// ========================
// SCORE UPDATES
// ========================

export function updateMatchScore(pandascoreId: number, scoreTeam1: number, scoreTeam2: number) {
  const stmt = db.prepare('UPDATE matches SET score_team1 = ?, score_team2 = ? WHERE pandascore_id = ?');
  return stmt.run(scoreTeam1, scoreTeam2, pandascoreId);
}

export function updateScoreTeam1(pandascoreId: number, score: number) {
  const stmt = db.prepare('UPDATE matches SET score_team1 = ? WHERE pandascore_id = ?');
  return stmt.run(score, pandascoreId);
}

export function updateScoreTeam2(pandascoreId: number, score: number) {
  const stmt = db.prepare('UPDATE matches SET score_team2 = ? WHERE pandascore_id = ?');
  return stmt.run(score, pandascoreId);
}

export function incrementScoreUpdates(pandascoreId: number) {
  const stmt = db.prepare('UPDATE matches SET score_updates = score_updates + 1 WHERE pandascore_id = ?');
  return stmt.run(pandascoreId);
}

// ========================
// ANNOUNCEMENT FLAGS
// ========================

export function markAnnounced24h(pandascoreId: number, value: boolean = true) {
  const stmt = db.prepare('UPDATE matches SET announced_24h = ? WHERE pandascore_id = ?');
  return stmt.run(value ? 1 : 0, pandascoreId);
}

export function markAnnounced1h(pandascoreId: number, value: boolean = true) {
  const stmt = db.prepare('UPDATE matches SET announced_1h = ? WHERE pandascore_id = ?');
  return stmt.run(value ? 1 : 0, pandascoreId);
}

export function markAnnounced10min(pandascoreId: number, value: boolean = true) {
  const stmt = db.prepare('UPDATE matches SET announced_10min = ? WHERE pandascore_id = ?');
  return stmt.run(value ? 1 : 0, pandascoreId);
}

export function markAnnounced1min(pandascoreId: number, value: boolean = true) {
  const stmt = db.prepare('UPDATE matches SET announced_1min = ? WHERE pandascore_id = ?');
  return stmt.run(value ? 1 : 0, pandascoreId);
}

// ========================
// WORKFLOW FLAGS
// ========================

export function markMatchAnnounced(pandascoreId: number, value: boolean = true) {
  const stmt = db.prepare('UPDATE matches SET announced = ? WHERE pandascore_id = ?');
  return stmt.run(value ? 1 : 0, pandascoreId);
}

export function markVotesClosed(pandascoreId: number, value: boolean = true) {
  const stmt = db.prepare('UPDATE matches SET votes_closed = ? WHERE pandascore_id = ?');
  return stmt.run(value ? 1 : 0, pandascoreId);
}

export function markPointsCalculated(pandascoreId: number, value: boolean = true) {
  const stmt = db.prepare('UPDATE matches SET point_calculated = ? WHERE pandascore_id = ?');
  return stmt.run(value ? 1 : 0, pandascoreId);
}

export function markResultAnnounced(pandascoreId: number, value: boolean = true) {
  const stmt = db.prepare('UPDATE matches SET result_announced = ? WHERE pandascore_id = ?');
  return stmt.run(value ? 1 : 0, pandascoreId);
}

// ========================
// QUERY HELPERS
// ========================

export function getMatchesForAnnouncement24h() {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE announced_24h = 0 
    AND datetime(begin_at) <= datetime('now', '+24 hours')
    AND datetime(begin_at) > datetime('now')
    AND status = 'not_started'
  `).all();
}

export function getMatchesForAnnouncement1h() {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE announced_1h = 0 
    AND datetime(begin_at) <= datetime('now', '+1 hour')
    AND datetime(begin_at) > datetime('now')
    AND status = 'not_started'
  `).all();
}

export function getMatchesForAnnouncement10min() {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE announced_10min = 0 
    AND datetime(begin_at) <= datetime('now', '+10 minutes')
    AND datetime(begin_at) > datetime('now')
    AND status = 'not_started'
  `).all();
}

export function getMatchesForAnnouncement1min() {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE announced_1min = 0 
    AND datetime(begin_at) <= datetime('now', '+1 minute')
    AND datetime(begin_at) > datetime('now')
    AND status = 'not_started'
  `).all();
}

export function getLiveMatches() {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE status IN ('running', 'in_progress', 'live')
  `).all();
}

export function getNextMatches(limit: number = 5) {
  return db.prepare(`
    SELECT * FROM matches
    WHERE datetime(begin_at) > datetime('now')
    AND status = 'not_started'
    ORDER BY begin_at ASC
    LIMIT ?
  `).all(limit);
}

// ...existing code...

// ========================
// SCHEDULER HELPERS
// ========================

export function getMatchesApproaching(minutesAhead: number = 10) {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE datetime(begin_at) <= datetime('now', '+${minutesAhead} minutes')
    AND datetime(begin_at) > datetime('now')
    AND status = 'not_started'
    ORDER BY begin_at ASC
  `).all();
}

export function isAnyMatchLive(): boolean {
  const liveMatches = getLiveMatches();
  return liveMatches.length > 0;
}

export function isAnyMatchApproaching(minutesAhead: number = 10): boolean {
  const approachingMatches = getMatchesApproaching(minutesAhead);
  return approachingMatches.length > 0;
}

export function getNextMatchInfo() {
  const nextMatch = db.prepare(`
    SELECT *, 
           CAST((julianday(begin_at) - julianday('now')) * 24 * 60 AS INTEGER) as minutes_until
    FROM matches
    WHERE datetime(begin_at) > datetime('now')
    AND status = 'not_started'
    ORDER BY begin_at ASC
    LIMIT 1
  `).get();
  
  return nextMatch;
}

export function getMatchesInTimeWindow(startMinutes: number, endMinutes: number) {
  return db.prepare(`
    SELECT * FROM matches 
    WHERE datetime(begin_at) >= datetime('now', '+${startMinutes} minutes')
    AND datetime(begin_at) <= datetime('now', '+${endMinutes} minutes')
    AND status = 'not_started'
    ORDER BY begin_at ASC
  `).all();
}