import { initEnv } from "../config/env";
import { Colors } from "../interface/color";
import { Match } from "../interface/match";

initEnv();

const API_KEY = process.env.PANDASCORE_API_KEY;

async function testFetchScheduledWorldsMatches() {
  const url =
    'https://api.pandascore.co/lol/matches?range[begin_at]=2025-01-01,2025-12-31&page=1&per_page=100&sort=-begin_at';

  try {
    const res = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!res.ok) throw new Error(`[ERROR]: PandaScore API: ${res.status}`);

    console.log(`${Colors.Green}, [SUCCESS]: Pandascore fetched successfully`);

    // ALL MATCHES
    const matches: Match[] = await res.json();

    // FILTERED MATCH
    const scheduledMatches = matches.filter(
      each =>
        (each.league?.name === 'Worlds' ||
          each.serie?.slug?.includes('world-championship')) &&
        each.opponents?.length === 2
    );

    scheduledMatches.forEach((each, index) => {
      const team1 = each.opponents[0].opponent.acronym;
      const team2 = each.opponents[1].opponent.acronym;

      const score1 = each.results.find(r => r.team_id === each.opponents[0].opponent.id)?.score ?? 0;
      const score2 = each.results.find(r => r.team_id === each.opponents[1].opponent.id)?.score ?? 0;

      console.log(`==== ${index + 1}. ${each.name} (${each.begin_at}) ====`);
      console.log(`Match: ${team1} vs ${team2}`);
      console.log(`Status: ${each.status}`);
      console.log(`Tournament: ${each.tournament?.name}`);
      console.log(`Score: ${team1}: ${score1} | ${team2}: ${score2}`);
      console.log(`Number of game: ${each.number_of_games}\n`)
    }); } catch (err) {
      console.error('[ERROR]: while fetching scheduled matches:', err);
    }
}

testFetchScheduledWorldsMatches();