import { getMatchById } from '../../db/matches';        // ✅ Votre fichier actuel
import { calculateAndDistributePoints } from '../../db/bets';    // ✅ À créer
import { addPoints } from '../../db/users';  
import { calculatePoints } from './calculatePoints';

export function processMatchResults(matchId: number) {
  console.log(`Processing results for match ${matchId}`);
  
  const match = getMatchById(matchId);
  if (!match) {
    console.log(`Match ${matchId} not found`);
    return;
  }
  
  if (match.status === 'finished' || match.status === 'closed') {
    const results = calculateAndDistributePoints(matchId);
    console.log(`Distributed ${results?.pointsPerWinner} points to ${results?.winnersCount} winners`);
  }
}
