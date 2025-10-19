import { initEnv } from "../config/env";
import { Colors } from "../interface/color";
import { ApiMatch } from "../interface/apiMatch";
import { insertMatch, updateMatchStatus, updateMatchScore, getMatchById } from "../db/matches";
import { Match } from "../interface/match";

export async function fetchWorldsMatches() {
  const url =
    'https://api.pandascore.co/lol/matches?range[begin_at]=2025-01-01,2025-12-31&page=1&per_page=50&sort=-begin_at';

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
    console.log(`${Colors.Green}[API]: Pandascore API fetched successfully${Colors.Reset}`);

    const matches: ApiMatch[] = await res.json();
    await processMatchesBatches(matches, 10);

  } catch (err) {
    console.error(`${Colors.Red}[ERROR]: Failed to fetch/update matches: ${err}${Colors.Reset}`);
  }
}

async function processMatchesBatches(matches: ApiMatch[], batchSize: number) {
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    
    if (batch.length > 0) {
      updateMatchesBatch(batch);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  if (global.gc) {
    console.log(`${Colors.Dim}[MEMORY]: Running garbage collection...${Colors.Reset}`);
    global.gc();
  }
}

function updateMatchesBatch(apiMatches: ApiMatch[]) {
  console.log(`${Colors.Yellow}[LOG]: Updating database batch${Colors.Reset}`);

  const confirmedMatches = apiMatches.filter(each => {
    const hasValidTeams = each.opponents.length === 2;
    const isWorlds = isWorldsMatch(each);
    return hasValidTeams && isWorlds;
  });

  console.log(`${Colors.Yellow}[LOG]: Found ${confirmedMatches.length} Worlds 2025 matches to process.${Colors.Reset}`);

  const db = require('../db/initDb').default;
  const insertTransaction = db.transaction(() => {
    confirmedMatches.forEach((apiMatch: ApiMatch) => {
      const dbMatch = convertApiMatchToDbMatch(apiMatch);
      
      const existingMatch = getMatchById(dbMatch.pandascore_id);
      
      if (!existingMatch) {
        insertMatch(dbMatch);
      } else {
        if (existingMatch.status !== dbMatch.status) {
          updateMatchStatus(dbMatch.pandascore_id, dbMatch.status);
        }
        
        if (existingMatch.score_team1 !== dbMatch.score_team1 || 
            existingMatch.score_team2 !== dbMatch.score_team2) {
          updateMatchScore(dbMatch.pandascore_id, dbMatch.score_team1, dbMatch.score_team2);
        }
      }
    });
  });

  insertTransaction();
  
  console.log(`${Colors.Green}[DB]: Batch transaction completed - ${confirmedMatches.length} matches processed${Colors.Reset}`);
}

function isWorldsMatch(apiMatch: ApiMatch): boolean {
  const worldsKeywords = ['worlds', 'world championship', 'world-championship-2025'];
  const leagueName = apiMatch.league?.name?.toLowerCase() || '';
  const serieName = apiMatch.serie?.name?.toLowerCase() || '';
  const serieSlug = apiMatch.serie?.slug?.toLowerCase() || '';
  
  return worldsKeywords.some(keyword => 
    leagueName.includes(keyword) || 
    serieName.includes(keyword) || 
    serieSlug.includes(keyword)
  );
}

function convertApiMatchToDbMatch(apiMatch: ApiMatch): Match {
  const team1 = apiMatch.opponents[0]?.opponent?.name || 'TBD';
  const team2 = apiMatch.opponents[1]?.opponent?.name || 'TBD';
  
  return {
    id: 0,
    pandascore_id: apiMatch.id,
    name: apiMatch.name || `${team1} vs ${team2}`,
    begin_at: apiMatch.begin_at || new Date().toISOString(),
    status: apiMatch.status || 'not_started',
    tournament: apiMatch.serie?.name || apiMatch.league?.name || 'Unknown Tournament',
    team1,
    team2,
    bo_count: apiMatch.number_of_games || 1,
    score_team1: apiMatch.results?.[0]?.score || 0,
    score_team2: apiMatch.results?.[1]?.score || 0,
    announced: 0,
    votes_closed: 0,
    point_calculated: 0,
    result_announced: 0,
    announced_24h: 0,
    announced_1h: 0,
    announced_10min: 0,
    announced_1min: 0,
    score_updates: 0
  };
}