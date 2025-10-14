import { initEnv } from './config/env';
import { fetchWorldsMatches } from './api/fetchApi';
import { startBot } from './bot/bot';
import { Colors } from './interface/color';
import { deployCommands } from './bot/deployCommands';

// ENV
initEnv();

console.log(`${Colors.Yellow}[LOG]: Bot started...${Colors.Reset}`);
deployCommands();

// Start Discord bot
(async () => {
  await startBot();
})();

setInterval(() => {
  fetchWorldsMatches();
}, 10 * 1000);