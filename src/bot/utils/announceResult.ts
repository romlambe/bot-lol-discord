import { TextChannel, EmbedBuilder } from "discord.js";
import { getMatchResults } from "../../db/matchDb"
import { Match } from "../../interface/match";
import { Colors } from "../../interface/color";

export async function announceResult(channel: TextChannel, match: Match) {
	const winner = match.score_team1 > match.score_team2 ? match.team1 : match.team2;
	const loser = match.score_team1 > match.score_team2 ? match.team2 : match.team1;
	const winnerScore = Math.max(match.score_team1, match.score_team2);
	const loserScore = Math.min(match.score_team1, match.score_team2);

	const resultEmbed = new EmbedBuilder()
		.setColor(0xFFD700) // Or
		.setTitle('🏆 MATCH TERMINÉ !')
		.setDescription(`**${match.team1} vs ${match.team2}**`)
		.addFields(
			{
				name: '📊 Score final',
				value: `**${winner}** ${winnerScore} - ${loserScore} ${loser}`,
				inline: false
			},
			{
				name: '🎯 Format',
				value: `BO${match.bo_count}`,
				inline: true
			},
		)
		.setTimestamp();

	await channel.send({ embeds: [resultEmbed] });
}
