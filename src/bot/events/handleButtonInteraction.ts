import { ButtonInteraction } from 'discord.js';
import { getMatchById } from '../../db/matches';
import { createUserIfNotExists } from '../../db/users';
import { placeBet, updateBet, getBetByUserAndMatch } from '../../db/bets';
import { Bet } from '../../interface/bet';

const Bets: Map<string, Bet> = new Map();

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const customId = interaction.customId;

  // Vote for winner
  if (customId.startsWith('vote_winner_')) {
    const parts = customId.split('_');
    const matchId = parseInt(parts[2]);
    const team = parts[3]; // 'team1' or 'team2'

    await handleWinnerVote(interaction, matchId, team);
  }
  
  // Vote for score
  else if (customId.startsWith('score_')) {
    const parts = customId.split('_');
    const matchId = parseInt(parts[1]);
    const score = parts[2]; // e.g., '3-1'

    await handleScoreVote(interaction, matchId, score);
  }
}

async function handleWinnerVote(interaction: ButtonInteraction, matchId: number, team: string) {
  const match = getMatchById(matchId);
  
  if (!match) {
    return interaction.reply({
      content: 'Match not found.',
      ephemeral: true
    });
  }

  // Check if betting is still open
  const matchTime = new Date(match.begin_at);
  const now = new Date();
  const minutesUntilMatch = (matchTime.getTime() - now.getTime()) / (1000 * 60);

  if (minutesUntilMatch <= 1 || match.votes_closed) {
    return interaction.reply({
      content: 'Betting is closed for this match.',
      ephemeral: true
    });
  }

  try {
    const user = createUserIfNotExists(interaction.user.id, interaction.user.username);
    const betKey = `${interaction.user.id}_${matchId}`;
    const teamName = team === 'team1' ? match.team1 : match.team2;

    // Vérifie s'il y a un pari existant complet
    const existingBet = getBetByUserAndMatch(user.id, matchId);
    
    if (existingBet) {
      // Pari existant - met à jour seulement l'équipe pour l'instant
      let currentIncomplete = Bets.get(betKey);
      if (!currentIncomplete) {
        currentIncomplete = { 
          userId: interaction.user.id, 
          matchId, 
          score: existingBet.predicted_score 
        };
      }
      currentIncomplete.team = team;
      Bets.set(betKey, currentIncomplete);

      return interaction.reply({
        content: `Team selected: **${teamName}**\n⚠️ Now select a score to complete your bet update.`,
        ephemeral: true
      });
    } else {
      // Nouveau pari - stocke l'équipe temporairement
      let currentIncomplete = Bets.get(betKey);
      if (!currentIncomplete) {
        currentIncomplete = { userId: interaction.user.id, matchId };
      }
      currentIncomplete.team = team;
      Bets.set(betKey, currentIncomplete);

      return interaction.reply({
        content: `Team selected: **${teamName}**\n⚠️ Now select a score to complete your bet.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error handling winner vote:', error);
    return interaction.reply({
      content: 'An error occurred while selecting your team.',
      ephemeral: true
    });
  }
}

async function handleScoreVote(interaction: ButtonInteraction, matchId: number, score: string) {
  const match = getMatchById(matchId);
  
  if (!match) {
    return interaction.reply({
      content: 'Match not found.',
      ephemeral: true
    });
  }

  // Check if betting is still open
  const matchTime = new Date(match.begin_at);
  const now = new Date();
  const minutesUntilMatch = (matchTime.getTime() - now.getTime()) / (1000 * 60);

  if (minutesUntilMatch <= 1 || match.votes_closed) {
    return interaction.reply({
      content: 'Betting is closed for this match.',
      ephemeral: true
    });
  }

  try {
    const user = createUserIfNotExists(interaction.user.id, interaction.user.username);
    const betKey = `${interaction.user.id}_${matchId}`;
    const incompleteBet = Bets.get(betKey);
    const existingBet = getBetByUserAndMatch(user.id, matchId);

    // Cas 1: Pari existant + score sélectionné
    if (existingBet && incompleteBet?.team) {
      // Met à jour le pari complet
      updateBet(interaction.user.id, matchId, incompleteBet.team, score);
      Bets.delete(betKey);
      
      const teamName = incompleteBet.team === 'team1' ? match.team1 : match.team2;
      return interaction.reply({
        content: `✅ **Bet updated successfully!**\n` +
                `Match: **${match.team1} vs ${match.team2}**\n` +
                `Winner: **${teamName}**\n` +
                `Score: **${score}**`,
        ephemeral: true
      });
    }
    
    // Cas 2: Nouveau pari + équipe déjà sélectionnée
    else if (incompleteBet?.team) {
      // Place le pari complet
      placeBet(interaction.user.id, matchId, incompleteBet.team, score);
      Bets.delete(betKey);
      
      const teamName = incompleteBet.team === 'team1' ? match.team1 : match.team2;
      return interaction.reply({
        content: `✅ **Bet placed successfully!**\n` +
                `Match: **${match.team1} vs ${match.team2}**\n` +
                `Winner: **${teamName}**\n` +
                `Score: **${score}**`,
        ephemeral: true
      });
    }
    
    // Cas 3: Score sélectionné mais pas d'équipe
    else {
      // Stocke le score temporairement
      let currentIncomplete = Bets.get(betKey);
      if (!currentIncomplete) {
        currentIncomplete = { userId: interaction.user.id, matchId };
      }
      currentIncomplete.score = score;
      Bets.set(betKey, currentIncomplete);

      return interaction.reply({
        content: `Score selected: **${score}**\n⚠️ Now select a winning team to complete your bet.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error handling score vote:', error);
    return interaction.reply({
      content: 'An error occurred while selecting your score.',
      ephemeral: true
    });
  }
}

// Fonction pour nettoyer les paris incomplets expirés (optionnel)
export function cleanupBets() {
  const now = Date.now();
  
  for (const [key, bet] of Bets.entries()) {
    const match = getMatchById(bet.matchId);
    if (!match) {
      Bets.delete(key);
      continue;
    }
    
    const matchTime = new Date(match.begin_at).getTime();
    if (matchTime - now <= 60000) { // Moins d'1 minute
      Bets.delete(key);
    }
  }
}