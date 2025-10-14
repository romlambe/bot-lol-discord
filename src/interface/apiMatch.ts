export interface ApiMatch {
  id: number;
  name: string;
  begin_at: string;
  status: string;
  league?: { name: string };
  serie?: { slug: string };
  tournament?: { name: string };
  opponents: { opponent: { id: number; acronym: string; name: string } }[];
  results: { team_id: number; score: number }[];
  number_of_games: number;
}