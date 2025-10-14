import fs from "fs";
import path from "path";
import { TextChannel } from "discord.js";
import { announceMatch } from "./announceMatch.js";
import { currentVotes } from "../tempVotes.js";

const dataPath = path.join(process.cwd(), "data.json");

export function scheduleAnnouncements(channel: TextChannel, minutesBefore: number = 10, closeVotesBefore: number = 1) {
	setInterval(() => {
		const rawData = fs.readFileSync(dataPath, "utf8");
		const data = JSON.parse(rawData);

		const now = new Date();

		data.matches.forEach((match: any) => {
			if (match.status !== "not_started") return;
			// if (match.announced) return;

		const matchTime = new Date(match.date);
		const diffMinutes = (matchTime.getTime() - now.getTime()) / 60000;

		if (diffMinutes <= minutesBefore && diffMinutes > 0) {
				announceMatch(channel, match);
				match.announced = true;
			}

		if (!match.votesClosed && diffMinutes <= closeVotesBefore && diffMinutes > 0) {
			match.votesClosed = true;
			match.status = "in_progress";

			// Supprimer les interactions restantes et bloquer les boutons
			// On peut ici envoyer un message de fermeture si on veut
			channel.send(`⏱ Les votes pour **${match.team1} vs ${match.team2}** sont maintenant fermés !`);

			// Supprimer les votes temporaires restant
			delete currentVotes[match.id];
			}
		});

		fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
	}, 1000 * 60);
}
