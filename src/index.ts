import { initEnv } from './config/env';
import { fetchWorldsMatches } from './api/fetchApi';
import { startBot } from './bot/bot';
import { Colors } from './interface/color';
import { deployCommands } from './bot/deployCommands';
import { processMatchResults } from './bot/utils/processMatchResults';
import { updateMatchResults, getFinishedMatches } from './db/matchDb';


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

  const finishedMatches = getFinishedMatches();
  finishedMatches.forEach((match: any) => {
    processMatchResults(match.pandascore_id);
	updateMatchResults(match.pandascore_id, 'processed');
  });
}, 10 * 1000);
