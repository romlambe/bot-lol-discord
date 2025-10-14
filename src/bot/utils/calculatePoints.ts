import { Colors } from '../../interface/color';

export function calculatePoints(
	predictedWinner: string,
	predictedScore: string,
	actualWinner: string,
	actualScore: string
): number {
	let points = 0;

	const correctWinner = predictedWinner === actualWinner;
	const correctScore = predictedScore === actualScore;

	if (correctWinner) {
		points += 10;
	}
	if (correctScore && correctWinner) {
		points += 25;
	}

	return points;
}
