import { TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Match } from '../../interface/match';
import { getBetsForMatch } from '../../db/bets';

export const announceMatch = async(channel: TextChannel, match: Match) => {
  const boCount = match.bo_count;
  const winsNeeded = Math.ceil(boCount / 2);

  // Calculate time left
  const matchTime = new Date(match.begin_at);
  const now = new Date();
  const diffMs = matchTime.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let timeUntilMatch = '';
  let bettingStatus = '';
  
  if (diffMinutes <= 1) {
    timeUntilMatch = 'Starting now';
    bettingStatus = '🔒 **BETTING CLOSED**';
  } else if (diffHours > 0) {
    timeUntilMatch = `${diffHours}h ${diffMinutes}m`;
    bettingStatus = '✅ Betting open';
  } else if (diffMinutes > 0) {
    timeUntilMatch = `${diffMinutes} minutes`;
    bettingStatus = diffMinutes <= 10 ? '⚠️ Betting closes soon' : '✅ Betting open';
  } else {
    timeUntilMatch = 'Starting soon';
    bettingStatus = '🔒 **BETTING CLOSED**';
  }

  // Get current bets
  const currentBets = getBetsForMatch(match.pandascore_id);
  const team1Bets = currentBets.filter((bet: any) => bet.predicted_winner === 'team1').length;
  const team2Bets = currentBets.filter((bet: any) => bet.predicted_winner === 'team2').length;

  // Create embed
  const embed = new EmbedBuilder()
    .setColor(diffMinutes <= 1 ? 0xFF0000 : 0xFFD700) // Red if closed, gold if open
    .setTitle(`${match.team1} vs ${match.team2}`)
    .setDescription(`**${match.tournament}**\nBest of ${boCount} | Match ID: ${match.pandascore_id}`)
    .addFields(
      { 
        name: '🕒 Match start', 
        value: matchTime.toLocaleString('en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }), 
        inline: true 
      },
      { name: '⏳ Time left', value: timeUntilMatch, inline: true },
      { name: '🎯 Betting status', value: bettingStatus, inline: true },
      { 
        name: '📊 Current bets', 
        value: `${match.team1}: ${team1Bets}\n${match.team2}: ${team2Bets}\nTotal: ${currentBets.length}`, 
        inline: false 
      }
    )
    .setFooter({ text: 'Betting closes 1 minute before match start!' })
    .setTimestamp();

  const components = [];

  // Only add buttons if betting is still open
  if (diffMinutes > 1 && !match.votes_closed) {
    // Team winner buttons
    const winnerRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`vote_winner_${match.pandascore_id}_team1`)
        .setLabel(`🔵 ${match.team1}`)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`vote_winner_${match.pandascore_id}_team2`)
        .setLabel(`🔴 ${match.team2}`)
        .setStyle(ButtonStyle.Primary)
    );

    // Score prediction buttons
    const scoreButtons: ButtonBuilder[] = [];
    for (let losses = 0; losses < winsNeeded; losses++) {
      const score = `${winsNeeded}-${losses}`;
      scoreButtons.push(
        new ButtonBuilder()
          .setCustomId(`score_${match.pandascore_id}_${score}`)
          .setLabel(score)
          .setStyle(ButtonStyle.Secondary)
      );
    }

    const scoreRow = new ActionRowBuilder<ButtonBuilder>().addComponents(...scoreButtons);

    components.push(winnerRow, scoreRow);
  }

  const messageContent = diffMinutes <= 1 ? 
    '🔒 **BETTING CLOSED** - Match starting!' : 
    '🎯 **BETTING AVAILABLE** - Select both team AND score to complete your bet!';

  await channel.send({
    content: messageContent,
    embeds: [embed],
    components: components,
  });
};