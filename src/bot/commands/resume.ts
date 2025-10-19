import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getAllMatches } from '../../db/matches';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Display match results and summary')
  .addIntegerOption(option =>
    option.setName('limit')
      .setDescription('Number of matches to display (max 15)')
      .setMinValue(1)
      .setMaxValue(15)
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName('status')
      .setDescription('Filter by match status')
      .addChoices(
        { name: 'All', value: 'all' },
        { name: 'Finished', value: 'finished' },
        { name: 'Live', value: 'running' },
        { name: 'Upcoming', value: 'not_started' }
      )
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const limit = interaction.options.getInteger('limit') || 10;
  const statusFilter = interaction.options.getString('status') || 'finished';
  
  let matches = getAllMatches();
  
  // Filter by status
  if (statusFilter !== 'all') {
    if (statusFilter === 'finished') {
      matches = matches.filter((match: any) => 
        match.status === 'finished' || match.status === 'closed'
      );
    } else {
      matches = matches.filter((match: any) => match.status === statusFilter);
    }
  }

  // Sort and limit
  matches = matches
    .sort((a: any, b: any) => new Date(b.begin_at).getTime() - new Date(a.begin_at).getTime())
    .slice(0, limit);

  if (!matches.length) {
    return interaction.reply({ 
      content: `No matches found with status "${statusFilter}".`, 
      ephemeral: true 
    });
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Match Results')
    .setDescription(`${matches.length} match(es) - Status: ${statusFilter}`);

  for (const match of matches) {
    const date = new Date(match.begin_at).toLocaleString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    let score;
    if (match.status === 'finished' || match.status === 'closed') {
      const winner = match.score_team1 > match.score_team2 ? match.team1 : match.team2;
      score = `${match.score_team1} - ${match.score_team2} (${winner} wins)`;
    } else if (match.status === 'running') {
      score = `${match.score_team1} - ${match.score_team2} (Live)`;
    } else {
      score = 'Not started';
    }

    embed.addFields({
      name: `${match.team1} 🆚 ${match.team2}`,
      value: `${match.tournament} - ${date}\n${score}`,
      inline: false
    });
  }

  return interaction.reply({ embeds: [embed] });
}