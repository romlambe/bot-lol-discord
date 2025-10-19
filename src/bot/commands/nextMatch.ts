import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getNextMatches } from '../../db/matches';

export const data = new SlashCommandBuilder()
  .setName('next')
  .setDescription('Display upcoming Worlds 2025 matches')
  .addIntegerOption(option =>
    option.setName('limit')
      .setDescription('Number of matches to display (max 10)')
      .setMinValue(1)
      .setMaxValue(10)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const limit = interaction.options.getInteger('limit') || 5;
  const matches = getNextMatches(limit);

  if (!matches.length) {
    return interaction.reply({ 
      content: 'No upcoming matches found.', 
      ephemeral: true 
    });
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Next Matches')
    .setDescription(`Upcoming ${matches.length} match(es)`);

  for (const match of matches) {
    const date = new Date(match.begin_at).toLocaleString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    embed.addFields({
      name: `${match.team1} 🆚 ${match.team2}`,
      value: `${match.tournament} - ${date}`,
      inline: false
    });
  }

  return interaction.reply({ embeds: [embed] });
}