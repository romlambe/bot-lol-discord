import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import fs from "fs";
import path from "path";

export const data = new SlashCommandBuilder()
	.setName("match")
	.setDescription("Affiche tous les matchs");

export async function execute(interaction: ChatInputCommandInteraction) {
	const dataPath = path.join(process.cwd(), "match.json");
	const rawData = fs.readFileSync(dataPath, "utf8");
	const data = JSON.parse(rawData);
	const matches = data.matches;

	let reply = "";
	matches.forEach((match: any) => {
		let line = `${match.team1} vs ${match.team2} - ${new Date(match.date).toLocaleString()} - ${match.status}`;
		if (match.status === "in_progress" || match.status === "finished") {
			line += ` - Score: ${match.score.team1}-${match.score.team2}`;
		}
		reply += line + "\n";
	});
	await interaction.reply(reply);
}
