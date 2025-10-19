import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getNextMatches } from '../../db/matches';
import { getBetsForMatch } from '../../db/bets';

export const data = new SlashCommandBuilder()
  .setName('bet')
  .setDescription('Display available matches for betting with interactive buttons');

export async function execute(interaction: ChatInputCommandInteraction) {
  // Récupère les matchs disponibles pour parier
  const upcomingMatches = getNextMatches(10).filter((match: any) => {
    const matchTime = new Date(match.begin_at);
    const now = new Date();
    const minutesUntilMatch = (matchTime.getTime() - now.getTime()) / (1000 * 60);
    
    return !match.votes_closed && 
           match.status === 'not_started' &&
           minutesUntilMatch > 1;
  });

  if (!upcomingMatches.length) {
    return interaction.reply({
      content: 'No matches currently available for betting.',
      ephemeral: true
    });
  }

  // Réponse initiale
  await interaction.reply({
    content: `🎯 **BETTING AVAILABLE** - ${upcomingMatches.length} match(es) open for betting\nSelect both team AND score to complete your bet!`,
    ephemeral: true
  });

  // Affiche tous les matchs disponibles (max 5 pour éviter les limites Discord)
  const matchesToShow = upcomingMatches.slice(0, 5);
  
  for (const [index, match] of matchesToShow.entries()) {
    const boCount = match.bo_count;
    const winsNeeded = Math.ceil(boCount / 2);

    // Calculate time left
    const matchTime = new Date(match.begin_at);
    const now = new Date();
    const diffMs = matchTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeUntilMatch = '';
    if (diffHours > 0) {
      timeUntilMatch = `${diffHours}h ${diffMinutes}m`;
    } else {
      timeUntilMatch = `${diffMinutes} minutes`;
    }

    // Get current bets
    const currentBets = getBetsForMatch(match.pandascore_id);
    const team1Bets = currentBets.filter((bet: any) => bet.predicted_winner === 'team1').length;
    const team2Bets = currentBets.filter((bet: any) => bet.predicted_winner === 'team2').length;

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
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
        { name: '🎯 Betting status', value: '✅ Betting open', inline: true },
        { 
          name: '📊 Current bets', 
          value: `${match.team1}: ${team1Bets}\n${match.team2}: ${team2Bets}\nTotal: ${currentBets.length}`, 
          inline: false 
        }
      );

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

    // Envoie chaque match
    await interaction.followUp({
      content: `**Match ${index + 1}/${matchesToShow.length}**`,
      embeds: [embed],
      components: [winnerRow, scoreRow],
      ephemeral: true
    });

    // Petite pause pour éviter le rate limiting
    if (index < matchesToShow.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Message de fin si il y a plus de 5 matchs
  if (upcomingMatches.length > 5) {
    await interaction.followUp({
      content: `*Showing ${matchesToShow.length} of ${upcomingMatches.length} available matches.*\n*Maximum 5 matches displayed at once to avoid rate limits.*`,
      ephemeral: true
    });
  }
}