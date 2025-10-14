import { TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Match } from "../types/types.js";

export const announceMatch = async (channel: TextChannel, match: Match) => {
	const winnerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`vote_winner_${match.id}_${match.team1}`)
			.setLabel(match.team1)
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`vote_winner_${match.id}_${match.team2}`)
			.setLabel(match.team2)
			.setStyle(ButtonStyle.Primary)
	);
	const scoreRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setCustomId(`score_${match.id}_3-0`).setLabel("3-0").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(`score_${match.id}_3-1`).setLabel("3-1").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(`score_${match.id}_3-2`).setLabel("3-2").setStyle(ButtonStyle.Secondary),

	);

	await channel.send({
		content: `**${match.team1} vs ${match.team2}** - ${new Date(match.date).toLocaleString()}`,
		components: [winnerRow, scoreRow],
	});
}
