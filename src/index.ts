import { initEnv } from './config/env';
import { fetchWorldsMatches } from './api/fetchApi';
import { startBot } from './bot/bot';
import { Colors } from './interface/color';
import { deployCommands } from './bot/deployCommands';
import { processMatchResults } from './bot/utils/processMatchResults';
import { updateMatchResults, getFinishedMatches, markPointsCalculated } from './db/matchDb';


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
}, 10 * 1000)

setInterval(() => {
  const finishedMatches = getFinishedMatches();
  if (finishedMatches.length > 0){
	finishedMatches.forEach((match: any) => {
		processMatchResults(match.pandascore_id);
		markPointsCalculated(match.pandascore_id);
 	});
  }

},10 * 1000);
