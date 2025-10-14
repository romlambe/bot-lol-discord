import { TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Match } from '../../interface/match';

export const announceMatch = async(channel: TextChannel, match: Match) => {

	const boCount = match.bo_count;
	const winsNeeded = Math.ceil(boCount / 2);

	//Calculate time left
	const matchTime = new Date(match.begin_at);
	const now = new Date();
	const diffMs = matchTime.getTime() - now.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

	let timeUntilMatch = '';
	if (diffHours > 0) {
		timeUntilMatch = `Dans ${diffHours}h ${diffMinutes}m`;
	} else if (diffMinutes > 0) {
		timeUntilMatch = `Dans ${diffMinutes} minutes`;
	} else {
		timeUntilMatch = 'Commence bientôt';
	}

	//Create embed
	const embed = new EmbedBuilder()
		.setColor(0xFFD700)
		.setTitle(`${match.team1} vs ${match.team2}`)
		.setDescription(`**${match.tournament || 'Tournament'}**\nBest of ${boCount}`)
		.addFields(
			{ name: '🕒 Début du match', value: matchTime.toLocaleString('fr-FR', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				hour: '2-digit',
				minute: '2-digit'
			}), inline: false },
			{ name: '⏳ Countdown', value: timeUntilMatch, inline: true },
			{ name: '🏆 Format', value: `BO${boCount}`, inline: true }
		)
		.setFooter({ text: '⚡ Placez vos paris maintenant !' })
		.setTimestamp();

	//Create score buttons
	const scoreButtons: ButtonBuilder[] = [];
	for (let losses = 0; losses < winsNeeded; losses++){
		const score = `${winsNeeded}-${losses}`;
		scoreButtons.push(
			new ButtonBuilder()
				.setCustomId(`score_${match.pandascore_id}_${score}`)
				.setLabel(score)
				.setStyle(ButtonStyle.Secondary)
		);
	}

	//Create teams buttons
	const winnerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`vote_winner_${match.pandascore_id}_${match.team1}`)
			.setLabel(`🔵 ${match.team1}`)
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(`vote_winner_${match.pandascore_id}_${match.team2}`)
			.setLabel(`🔴 ${match.team2}`)
			.setStyle(ButtonStyle.Primary)
	);


	const scoreRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...scoreButtons);

	await channel.send({
		content: '📢 **NOUVEAU MATCH À VENIR !**',
		embeds: [embed],
		components: [winnerRow, scoreRow],
	});
}
