import { initEnv } from './config/env';
import { fetchWorldsMatches } from './api/fetchApi';
import { startBot } from './bot/bot';
import { Colors } from './interface/color';
import { deployCommands } from './bot/deployCommands';
import { processMatchResults } from './bot/utils/processMatchResults';
import { updateMatchResults, getFinishedMatches, markPointsCalculated, getFinishedMatchesNotAnnounced, markResultAnnounced } from './db/matchDb';
import { TextChannel } from 'discord.js';
import { announceResult } from './bot/utils/announceResult';


// ENV
initEnv();

console.log(`${Colors.Yellow}[LOG]: Bot started...${Colors.Reset}`);
deployCommands();

// Start Discord bot
let botClient: any = null;
(async () => {
  botClient = await startBot();
})();

setInterval(() => {
	fetchWorldsMatches();
}, 10 * 1000)

setInterval(async () => {
	if (!botClient) return;

  const finishedMatches = getFinishedMatches();
  if (finishedMatches.length > 0){
	finishedMatches.forEach((match: any) => {
		processMatchResults(match.pandascore_id);
		markPointsCalculated(match.pandascore_id);
 	});
  }

  const matchesToAnnounce = getFinishedMatchesNotAnnounced();

  	if (matchesToAnnounce.length > 0) {
    const channelId = process.env.CHANNEL_ID;
    if (channelId) {
      try {
        const channel = await botClient.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          for (const match of matchesToAnnounce) {
            await announceResult(channel as TextChannel, match);
            markResultAnnounced(match.pandascore_id);
          }
        }
      } catch (error) {
        console.error(`${Colors.Red}[ERROR]: Could not announce results: ${error}${Colors.Reset}`);
      }
    }
  }

},10 * 1000);

