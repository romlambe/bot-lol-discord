import { TextChannel } from 'discord.js';
import { Colors } from '../../interface/color';
import { 
  getMatchesForAnnouncement24h,
  getMatchesForAnnouncement1h, 
  getMatchesForAnnouncement1min, // Remplacé 10min par 1min
  markAnnounced24h,
  markAnnounced1h,
  markAnnounced1min, // Remplacé 10min par 1min
  markVotesClosed,
  getFinishedMatches,
  markPointsCalculated,
  markResultAnnounced,
  getFinishedMatchesNotAnnounced
} from '../../db/matches';
import { calculateAndDistributePoints } from '../../db/bets';

export function scheduleAnnouncements(channel: TextChannel) {
  console.log(`${Colors.Blue}[SCHEDULER]: Starting announcement scheduler${Colors.Reset}`);
  
  // Vérifie toutes les 30 secondes pour plus de précision sur la fermeture à 1 minute
  setInterval(async () => {
    try {
      await checkAnnouncements(channel);
      await processFinishedMatches(channel);
    } catch (error) {
      console.error(`${Colors.Red}[SCHEDULER ERROR]: ${error}${Colors.Reset}`);
    }
  }, 30 * 1000); // 30 secondes
}

async function checkAnnouncements(channel: TextChannel) {
  // Annonces 24h
  const matches24h = getMatchesForAnnouncement24h();
  for (const match of matches24h) {
    await announce24hBefore(channel, match);
    markAnnounced24h(match.pandascore_id);
  }

  // Annonces 1h
  const matches1h = getMatchesForAnnouncement1h();
  for (const match of matches1h) {
    await announce1hBefore(channel, match);
    markAnnounced1h(match.pandascore_id);
  }

  // Annonces 1min + fermeture des votes (remplacé 10min par 1min)
  const matches1min = getMatchesForAnnouncement1min();
  for (const match of matches1min) {
    await announce1minBefore(channel, match);
    markAnnounced1min(match.pandascore_id);
    markVotesClosed(match.pandascore_id);
  }
}

async function processFinishedMatches(channel: TextChannel) {
  // Calcule les points pour les matchs terminés
  const finishedMatches = getFinishedMatches();
  for (const match of finishedMatches) {
    const result = calculateAndDistributePoints(match.pandascore_id);
    markPointsCalculated(match.pandascore_id);
    console.log(`${Colors.Green}[POINTS]: Calculated points for match ${match.name}${Colors.Reset}`);
  }

  // Annonce les résultats
  const matchesToAnnounce = getFinishedMatchesNotAnnounced();
  for (const match of matchesToAnnounce) {
    await announceResults(channel, match);
    markResultAnnounced(match.pandascore_id);
  }
}

async function announce24hBefore(channel: TextChannel, match: any) {
  const message = `**Upcoming Match - 24h Notice**\n\n` +
                 `**${match.team1}** vs **${match.team2}**\n` +
                 `Tournament: ${match.tournament}\n` +
                 `Format: BO${match.bo_count}\n` +
                 `Start time: ${new Date(match.begin_at).toLocaleString('en-US')}\n\n` +
                 `Use \`/bet\` to place your bets!`;
  
  await channel.send(message);
  console.log(`${Colors.Green}[ANNOUNCEMENT]: 24h notice for ${match.name}${Colors.Reset}`);
}

async function announce1hBefore(channel: TextChannel, match: any) {
  const message = `**Match Starting Soon - 1h Notice**\n\n` +
                 `**${match.team1}** vs **${match.team2}**\n` +
                 `Starting in approximately 1 hour!\n` +
                 `Last chance to place or modify your bets with \`/bet\``;
  
  await channel.send(message);
  console.log(`${Colors.Green}[ANNOUNCEMENT]: 1h notice for ${match.name}${Colors.Reset}`);
}

async function announce1minBefore(channel: TextChannel, match: any) {
  const message = `**🔒 BETTING CLOSED - Final Warning**\n\n` +
                 `**${match.team1}** vs **${match.team2}**\n` +
                 `Match starting in 1 minute!\n` +
                 `🔒 **Betting is now CLOSED** for this match.`;
  
  await channel.send(message);
  console.log(`${Colors.Green}[ANNOUNCEMENT]: 1min notice + votes closed for ${match.name}${Colors.Reset}`);
}

async function announceResults(channel: TextChannel, match: any) {
  const winner = match.score_team1 > match.score_team2 ? match.team1 : match.team2;
  
  const message = `**Match Results**\n\n` +
                 `**${match.team1}** ${match.score_team1} - ${match.score_team2} **${match.team2}**\n` +
                 `Winner: **${winner}**\n\n` +
                 `Points have been distributed to winning bettors!\n` +
                 `Check your rank with \`/leaderboard\``;
  
  await channel.send(message);
  console.log(`${Colors.Green}[ANNOUNCEMENT]: Results announced for ${match.name}${Colors.Reset}`);
}