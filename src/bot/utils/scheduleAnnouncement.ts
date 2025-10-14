import { TextChannel} from 'discord.js';
import { announceMatch } from "./announceMatch";
import { currentVotes } from "./tempsVote";
import { getMatchNotStarted, updateMatchAnnounced, updateMatchVotesClosed } from '../../db/matchDb';

export function scheduleAnnouncements(channel: TextChannel, minutesBefore: number = 10, closeVotesBefore: number = 1) {
	setInterval(() => {

		const matches = getMatchNotStarted();
		const now = new Date();

		matches.forEach((match: any) => {
			const matchTime = new Date(match.begin_at);
			const diffMinutes = (matchTime.getTime() - now.getTime()) / 60000;

			if (!match.announced && diffMinutes <= minutesBefore && diffMinutes > 0) {
				announceMatch(channel, match);
				updateMatchAnnounced(match.id);
			}

			if (!match.votes_closed && diffMinutes <= closeVotesBefore && diffMinutes > 0) {
				updateMatchVotesClosed(match.id);
				channel.send(`⏱ Les votes pour **${match.team1} vs ${match.team2}** sont maintenant fermés !`);
				delete currentVotes[match.id];
			}

		});
	}, 1000 * 60);
}
