export interface Match {

  id: number;

  // STATUS
  name: string;
  begin_at: string;
  status: string;
  league: { name: string };
  serie: { slug: string };
  tournament: { name: string };

  // TEAM
  opponents: { opponent: { id: number; acronym: string; name: string } }[];
  team1: string;
  team2: string;

  // SCORE
  results: { team_id: number; score: number }[];
  number_of_games: number;
}
