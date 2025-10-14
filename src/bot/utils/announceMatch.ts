import { TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Match } from '../../interface/match';

export const announceMatch = async(channel: TextChannel, match: Match) => {

	const winnerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`vote_winner_${match.id}_${match.opponents[0].opponent.name}`)
			.setLabel(`${match.opponents[0].opponent.name}`)
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`vote_winner_${match.id}_${match.opponents[1].opponent.name}`)
			.setLabel(`${match.opponents[1].opponent.name}`)
			.setStyle(ButtonStyle.Primary)
	);
	const scoreRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder().setCustomId(`score_${match.id}_3-0`).setLabel("3-0").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(`score_${match.id}_3-1`).setLabel("3-1").setStyle(ButtonStyle.Secondary),
		new ButtonBuilder().setCustomId(`score_${match.id}_3-2`).setLabel("3-2").setStyle(ButtonStyle.Secondary),
	)

	await channel.send({
		content: `**${match.opponents[0].opponent.name} vs ${match.opponents[1].opponent.name}** - ${new Date(match.begin_at).toLocaleString()}`,
		components: [winnerRow, scoreRow],
	})
}
