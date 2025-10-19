import { initEnv } from './config/env';
import { MemoryManager } from './perf/memoryManager';
import { fetchWorldsMatches } from './api/fetchApi';
import { Colors } from './interface/color';
import { FetchScheduler } from './service/fetchScheduler';

// DISCORD
import { deployCommands } from './bot/deployCommands';
import { startBot } from './bot/bot';


// FETCH SCHEDULER
const fetchScheduler = new FetchScheduler();

// ENV
initEnv();

// MEMORY MANAGEMENT
const memoryManager = MemoryManager.getInstance();
memoryManager.startMemoryMonitoring();

// TEST OR PROD
console.log(`${Colors.Yellow}[LOG]: process.env.ENVIRONMENT = "${process.env.ENVIRONMENT}"${Colors.Reset}`);
const isProd = process.env.ENVIRONMENT === 'prod';
console.log(`${Colors.Yellow}[LOG]: Running in ${isProd ? 'PRODUCTION' : 'TEST'} mode${Colors.Reset}`);
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = isProd ? process.env.CLIENT_ID : process.env.CLIENT_ID_TEST;
const GUILD_ID = isProd ? process.env.GUILD_ID : process.env.GUILD_ID_TEST;
const CHANNEL_ID = isProd ? process.env.CHANNEL_ID : process.env.GUILD_ID_TEST;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error(`${Colors.Red}[ERROR]: Missing required environment variables${Colors.Reset}`);
  process.exit(1);
}

// BOT CLIENT
let botClient: any = null;

// MEMORY INITIAL CHECK
const initialMemory = memoryManager.getMemoryUsage();
console.log(`${Colors.Dim}[MEMORY]: Initial usage - Heap: ${initialMemory.heapUsed}MB, RSS: ${initialMemory.rss}MB${Colors.Reset}`);

(async () => {
  try {

    // INIT DB
    await initializeDatabase();
    
    // DEPLOY COMMANDS
    console.log(`${Colors.Purple}[BOT]: Deploying Discord commands...${Colors.Reset}`);
    await deployCommands(DISCORD_TOKEN, CLIENT_ID, GUILD_ID, CHANNEL_ID);
    console.log(`${Colors.Green}[BOT]: Commands deployed successfully!${Colors.Reset}`);

    // BOT
    console.log(`${Colors.Purple}[BOT]: Starting Discord bot...${Colors.Reset}`);
    botClient = await startBot(CHANNEL_ID, DISCORD_TOKEN);
    console.log(`${Colors.Green}[BOT]: Discord bot connected successfully!${Colors.Reset}`);

    // START SCHEDULER
    console.log(`${Colors.Green}[INFO]: Starting adaptive fetch scheduler...${Colors.Reset}`);
    fetchScheduler.start();
    
    // DB MONITORING AND SCHEDULER
    setInterval(() => {
      try {
        const db = require('./db/initDb').default;
        const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get() as { count: number };
        const schedulerMode = fetchScheduler.getCurrentMode();
        const nextFetchIn = Math.round(fetchScheduler.getNextFetchIn() / 1000 / 60); // en minutes
        
        console.log(`${Colors.Blue}[STATUS]: ${matchCount.count} matches | Scheduler: ${schedulerMode} mode | Next fetch in: ${nextFetchIn}min${Colors.Reset}`);
      } catch (error) {
        console.error(`${Colors.Red}[ERROR]: Failed to get status: ${error}${Colors.Reset}`);
      }
    }, 5 * 60 * 1000);
    
    console.log(`${Colors.Green}[SUCCESS]: Bot is now running with adaptive fetching!${Colors.Reset}`);
    
  } catch (error) {
    console.error(`${Colors.Red}[FATAL]: Failed to start bot: ${error}${Colors.Reset}`);
    process.exit(1);
  }
})();

// INIT DATABASE
async function initializeDatabase() {
  console.log(`${Colors.Yellow}[LOG]: Starting initial database population...${Colors.Reset}`);
  
  try {

    // Get initial match count
    const db = require('./db/initDb').default;
    const initialCount = db.prepare('SELECT COUNT(*) as count FROM matches').get() as { count: number };
    console.log(`${Colors.Yellow}[LOG]: Current matches in DB: ${initialCount.count}${Colors.Reset}`);
    
    await fetchWorldsMatches();
    
    // Get updated match count
    const finalCount = db.prepare('SELECT COUNT(*) as count FROM matches').get() as { count: number };
    const addedMatches = finalCount.count - initialCount.count;
    
    console.log(`${Colors.Green}[LOG]: Database initialization completed!${Colors.Reset}`);
    console.log(`${Colors.Yellow}[LOG]: Added ${addedMatches} new matches (Total: ${finalCount.count})${Colors.Reset}`);
    
    return finalCount.count;
    
  } catch (error) {
    console.error(`${Colors.Red}[ERROR]: Initial database population failed: ${error}${Colors.Reset}`);
    throw error;
  }
}

// EXIT
process.on('SIGINT', () => {
  console.log(`${Colors.Red}[LOG]: Shutting down gracefully...${Colors.Reset}`);
  
  if (botClient) {
    console.log(`${Colors.Red}[BOT]: Disconnecting bot...${Colors.Reset}`);
    botClient.destroy();
  }
  
  fetchScheduler.stop();
  process.exit(0);
});