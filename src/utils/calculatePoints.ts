import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data.json");

export function calculatePoints(matchId:string) {
	const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

	const match = data.matches.find((m: any) => m.id === matchId);
	if (!match || !match.winner || !match.score) return;

	data.votes.forEach((vote: any) => {
		if (vote.matchId !== matchId) return;

		let user = data.users.find((u: any) => u.userId === vote.userId);
    if (!user) {
      user = { userId: vote.userId, points: 0 };
      data.users.push(user);
    }

    // Calcul des points
    if (vote.winner === match.winner) user.points += 10;
    if (vote.score === match.score) user.points += 15;
  });

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}
