import { initEnv } from "../config/env";
import { updateMatches } from "../db/matchDb";
import { Match } from "../interface/match";
import { Colors } from "../interface/color";
import { ApiMatch } from "../interface/apiMatch";

/* MaJ - RAM usage:

processMatchesBatch { ApiMatch[], batchSize } */

export async function fetchWorldsMatches() {
  const url =
    'https://api.pandascore.co/lol/matches?range[begin_at]=2025-01-01,2025-12-31&page=1&per_page=100&sort=-begin_at';

  try {
    console.log(`${Colors.Yellow}[LOG]: Trying to fetch Pandascore API...${Colors.Reset}`);
    const res = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${process.env.PANDASCORE_API_KEY}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Pandascore API returned status ${res.status}`);
    }
    console.log(`${Colors.Green}[SUCCESS]: Pandascore API fetched successfully${Colors.Reset}`);

    const matches: ApiMatch[] = await res.json();
    await processMatchesBatches(matches, 10);

  } catch (err) {
    console.error(`${Colors.Red}[ERROR]: Failed to fetch/update matches: ${err}${Colors.Reset}`);
  }
}

async function processMatchesBatches(matches: ApiMatch[], batchSize: number) {
  let i = 0;
  for (i = 0; i <= matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);

    if (batch.length > 0)
      updateMatches(batch);
      await new Promise(resolve => setTimeout(resolve, 10));
  }

  // garbage collector management
  if (global.gc) {
    console.log(`${Colors.Dim}[GC]: Running garbage collection...${Colors.Reset}`);
    global.gc();
  }
}