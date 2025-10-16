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

// TEST OR PROD
console.log(`${Colors.Cyan}[DEBUG]: process.env.ENVIRONMENT = "${process.env.ENVIRONMENT}"${Colors.Reset}`);
const isProd = process.env.ENVIRONMENT === 'prod';
console.log(`${Colors.Cyan}[INFO]: Running in ${isProd ? 'PRODUCTION' : 'TEST'} mode${Colors.Reset}`);
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = isProd ? process.env.CLIENT_ID : process.env.CLIENT_ID_TEST;
const CHANNEL_ID = isProd ? process.env.CHANNEL_ID : process.env.CHANNEL_ID_TEST;
const GUILD_ID = isProd ? process.env.GUILD_ID : process.env.GUILD_ID_TEST;
console.log(`${DISCORD_TOKEN}`);
console.log(`${CLIENT_ID}`);
console.log(`${CHANNEL_ID}`);
console.log(`${GUILD_ID}`);
if (!DISCORD_TOKEN || !CLIENT_ID || !CHANNEL_ID || !GUILD_ID) {
  console.error(`${Colors.Red}[ERROR]: Missing required environment variables${Colors.Reset}`);
  process.exit(1);
}
console.log(`${Colors.Yellow}[LOG]: Bot started...${Colors.Reset}`);

// COMMAND DEPLOYEMENT
deployCommands(DISCORD_TOKEN, CLIENT_ID, GUILD_ID);

// START FETCH AND BOT ROUTINE
let botClient: any = null;
(async () => {
  botClient = await startBot(CHANNEL_ID, DISCORD_TOKEN);
})()

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
    const channelId = CHANNEL_ID;
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

