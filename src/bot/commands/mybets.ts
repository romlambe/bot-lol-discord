import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getUserBets, getActiveBets } from '../../db/bets';

export const data = new SlashCommandBuilder()
  .setName('mybets')
  .setDescription('View your betting history')
  .addStringOption(option =>
    option.setName('filter')
      .setDescription('Filter bets by status')
      .addChoices(
        { name: 'All bets', value: 'all' },
        { name: 'Active bets', value: 'active' }
      )
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const filter = interaction.options.getString('filter') || 'all';
  
  let bets;
  if (filter === 'active') {
    bets = getActiveBets(interaction.user.id);
  } else {
    bets = getUserBets(interaction.user.id);
  }

  if (!bets.length) {
    return interaction.reply({
      content: filter === 'active' ? 'You have no active bets.' : 'You have not placed any bets yet.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(filter === 'active' ? 'Your Active Bets' : 'Your Betting History')
    .setDescription(`${bets.length} bet(s) found`);

  for (const bet of bets.slice(0, 10)) { // Limite à 10 pour éviter des messages trop longs
    const teamName = bet.predicted_winner === 'team1' ? bet.team1 : bet.team2;
    const matchDate = new Date(bet.begin_at).toLocaleString('en-US');
    
    let statusText = '';
    if (bet.status === 'finished' || bet.status === 'closed') {
      statusText = bet.points > 0 ? `✅ Won (${bet.points} pts)` : '❌ Lost';
    } else if (bet.status === 'running') {
      statusText = '🔴 Live';
    } else {
      statusText = '⏳ Pending';
    }

    embed.addFields({
      name: `${bet.team1} vs ${bet.team2}`,
      value: `Prediction: **${teamName}**\n${matchDate}\n${statusText}`,
      inline: true
    });
  }

  if (bets.length > 10) {
    embed.setFooter({ text: `Showing 10 of ${bets.length} bets` });
  }

  return interaction.reply({ embeds: [embed], ephemeral: true });
}