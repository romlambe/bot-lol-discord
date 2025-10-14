export interface Match {
  id: number;
  pandascore_id: number;
  name: string;
  begin_at: string;
  status: string;
  tournament: string;
  team1: string;
  team2: string;
  bo_count: number;
  score_team1: number;
  score_team2: number;
  announced: number;
  votes_closed: number;
}