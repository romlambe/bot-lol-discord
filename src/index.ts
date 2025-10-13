import { initEnv } from './config/env';
import { fetchWorldsMatches } from './api/fetchApi';
import { Colors } from './interface/color';

// ENV
initEnv();

console.log(`${Colors.Yellow}[LOG]: Bot started...${Colors.Reset}`);

setInterval(() => {
  fetchWorldsMatches();
}, 10 * 1000);
