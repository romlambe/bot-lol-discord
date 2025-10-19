import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getLiveMatches } from '../../db/matches';
import { getBetsForMatch } from '../../db/bets';

export const data = new SlashCommandBuilder()
  .setName('current')
  .setDescription('Display currently live matches with scores and bets');

export async function execute(interaction: ChatInputCommandInteraction) {
  const liveMatches = getLiveMatches();

  if (!liveMatches.length) {
    return interaction.reply({
      content: 'No match currently live.',
      ephemeral: true,
    });
  }

  // Si un seul match
  if (liveMatches.length === 1) {
    const match = liveMatches[0];
    
    const embed = new EmbedBuilder()
      .setTitle(`${match.team1} 🆚 ${match.team2}`)
      .setDescription(`BO${match.bo_count} | Started ${new Date(match.begin_at).toLocaleString('en-US')}`)
      .addFields(
        { name: 'Tournament', value: match.tournament, inline: true },
        { name: 'Score', value: `${match.score_team1} - ${match.score_team2}`, inline: true },
        { name: 'Status', value: match.status, inline: true },
      );

    // Get bets for this match
    const bets = getBetsForMatch(match.pandascore_id);

    if (bets.length) {
      const betList = bets
        .map(bet => `• <@${bet.user_id}> bet on **${bet.predicted_winner}**`)
        .join('\n');

      embed.addFields({ name: 'Current bets', value: betList });
    } else {
      embed.addFields({ name: 'Current bets', value: 'No bets registered for this match' });
    }

    return interaction.reply({ embeds: [embed] });
  }

  // Si plusieurs matchs
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Live Matches')
    .setDescription(`${liveMatches.length} matches currently live`);

  for (const match of liveMatches) {
    const bets = getBetsForMatch(match.pandascore_id);
    const betCount = bets.length;

    embed.addFields({
      name: `${match.team1} 🆚 ${match.team2}`,
      value: `${match.tournament} | Score: ${match.score_team1} - ${match.score_team2} | ${betCount} bet(s)`,
      inline: false
    });
  }

  return interaction.reply({ embeds: [embed] });
}