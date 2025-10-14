import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getMatchById, getNextMatches } from '../../db/matchDb';

export const data = new SlashCommandBuilder()
  .setName('match')
  .setDescription('Get information about a match')

export async function execute(interaction) {
	
	const matches = getNextMatches(5);

	if (!matches.length) {
		return interaction.reply({ content: 'No matches found', ephemeral: true });
	}

	const embed = new EmbedBuilder()
		.setColor('#0099ff')
		.setTitle('Next Matches')

	for (const match of matches) {
		const date = new Date(match.begin_at).toLocaleString('fr-FR',{
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});

		const score =
			match.status === 'running'|| match.status === 'finished'
			?	`${match.score_team1} - ${match.score_team2}`
			: 'Not started';

		embed.addFields({
			name: `${match.team1} 🆚 ${match.team2}`,
			value: `${match.tournament || "Tournoi inconnu"} - ${date}` ,
		});
	}

	return interaction.reply({ embeds: [embed] });
}
