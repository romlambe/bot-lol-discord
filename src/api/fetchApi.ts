import { initEnv } from "../config/env";
import { updateMatches } from "../db/updateDb";
import { Match } from "../interface/match";
import { Colors } from "../interface/color";

initEnv();

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

    const matches: Match[] = await res.json();

    updateMatches(matches);

  } catch (err) {
    console.error(`${Colors.Red}[ERROR]: Failed to fetch/update matches: ${err}${Colors.Reset}`);
  }
}

fetchWorldsMatches();
