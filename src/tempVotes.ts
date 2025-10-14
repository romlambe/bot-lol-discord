export interface Vote {
	userId: string;
	matchId: string;
	winner?: string;
	score?: string;
}

export const currentVotes: Record<string, Vote[]> = {};
