import { getMatchResults } from '../../db/matchDb';
import { getMatchBets, updateBetPoints } from '../../db/betDb';
import { getUserByDiscordId, updateUserPoints } from '../../db/userDb';
import { calculatePoints } from './calculatePoints';

export function processMatchResults(matchId: number) {
	const match = getMatchResults(matchId) as any;
	if (!match) return;

	if (match.status !== 'finished') return;

	const actualWinner = match.score_team1 > match.score_team2 ? match.team1 : match.team2;
	const winnerScore = Math.max(match.score_team1, match.score_team2);
	const loserScore = Math.min(match.score_team1, match.score_team2);
	const actualScore = `${winnerScore}-${loserScore}`;

	const bets = getMatchBets(matchId) as any;

	if (bets.length === 0) return;

	bets.forEach((bet: any) => {
		const points = calculatePoints(bet.predicted_winner, bet.predicted_score, actualWinner, actualScore);
		updateBetPoints(bet.id, points);
		const user = getUserByDiscordId(bet.discord_id) as any;
		if (user) {
			const newPoints = user.points + points;
			updateUserPoints(user.discord_id, user.points + points);
		}
	});
}
