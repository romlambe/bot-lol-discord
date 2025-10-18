// DEPENDANCES
import { TextChannel } from 'discord.js';

// CUSTOM 
import { initEnv } from './config/env';
import { MemoryManager } from './perf/memoryManager';

// API
import { fetchWorldsMatches } from './api/fetchApi';

// BOT
import { deployCommands } from './bot/deployCommands';
import { processMatchResults } from './bot/utils/processMatchResults';
import { startBot } from './bot/bot';
import { announceResult } from './bot/utils/announceResult';

// DB
import { updateMatchResults, getFinishedMatches, markPointsCalculated, getFinishedMatchesNotAnnounced, markResultAnnounced } from './db/matchDb';

// INTERFACES
import { Colors } from './interface/color';


// ENV
initEnv();

// MEMORY MANAGEMENT
const memoryManager = MemoryManager.getInstance();
memoryManager.startMemoryMonitoring();

// TEST OR PROD
console.log(`${Colors.Cyan}[DEBUG]: process.env.ENVIRONMENT = "${process.env.ENVIRONMENT}"${Colors.Reset}`);
const isProd = process.env.ENVIRONMENT === 'prod';
console.log(`${Colors.Cyan}[INFO]: Running in ${isProd ? 'PRODUCTION' : 'TEST'} mode${Colors.Reset}`);
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = isProd ? process.env.CLIENT_ID : process.env.CLIENT_ID_TEST;
const CHANNEL_ID = isProd ? process.env.CHANNEL_ID : process.env.CHANNEL_ID_TEST;
const GUILD_ID = isProd ? process.env.GUILD_ID : process.env.GUILD_ID_TEST;

if (!DISCORD_TOKEN || !CLIENT_ID || !CHANNEL_ID || !GUILD_ID) {
  console.error(`${Colors.Red}[ERROR]: Missing required environment variables${Colors.Reset}`);
  process.exit(1);
}
console.log(`${Colors.Yellow}[LOG]: Bot started...${Colors.Reset}`);

// MEMORY INITIAL CHECK
const initialMemory = memoryManager.getMemoryUsage();
console.log(`${Colors.Dim}[MEMORY]: Initial usage - Heap: ${initialMemory.heapUsed}MB, RSS: ${initialMemory.rss}MB${Colors.Reset}`);

// DEBUG 
// console.log(`${DISCORD_TOKEN}`);
// console.log(`${CLIENT_ID}`);
// console.log(`${CHANNEL_ID}`);
// console.log(`${GUILD_ID}`);

// COMMAND DEPLOYEMENT
deployCommands(DISCORD_TOKEN, CLIENT_ID, GUILD_ID);

// START FETCH AND BOT ROUTINE
let botClient: any = null;
(async () => {
  botClient = await startBot(CHANNEL_ID, DISCORD_TOKEN);
})()

setInterval(() => {
  // MEMORY ANTE FETCH
  const beforeMemory = memoryManager.getMemoryUsage();
  console.log(`${Colors.Dim}[MEMORY]: Before fetch - Heap: ${beforeMemory.heapUsed}MB${Colors.Reset}`);

	fetchWorldsMatches();

  // MEMORY POST FETCH
  const afterMemory = memoryManager.getMemoryUsage();
  console.log(`${Colors.Dim}[MEMORY]: After fetch - Heap: ${afterMemory.heapUsed}MB${Colors.Reset}`);
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

