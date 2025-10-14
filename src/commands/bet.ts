import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "match.json");
const rawData = fs.readFileSync(dataPath, "utf8");
const matchData = JSON.parse(rawData);

const upComingMatches = matchData.matches
	.filter((m: any) => m.status === "not_started")
	.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

const matchChoices = upComingMatches.map((m: any) => ({
	name: `${m.team1} vs ${m.team2} - ${new Date(m.date).toLocaleString()}`,
	value: m.id
}));

const scoreChoices = [
	"3-0",
	"3-1",
	"3-2",
].map(s=>({ name: s, value: s }));

const allTeams = Array.from(new Set(matchData.matches.flatMap((m: any) => [m.team1, m.team2]))) as string[];
const winnerChoices = allTeams.map(t => ({ name: t, value: t }));

export const data = new SlashCommandBuilder()
	.setName("bet")
	.setDescription("Placez un pari")
	.addStringOption(option =>
		option.setName("match")
			.setDescription("ID du match")
			.setRequired(true)
			.addChoices(...matchChoices))
	.addStringOption(option =>
		option.setName("winner")
			.setDescription("Le vainqueur du match")
			.setRequired(true)
			.addChoices(...winnerChoices))
	.addStringOption(option =>
		option.setName("score")
			.setDescription("Le score du match")
			.setRequired(false)
			.addChoices(...scoreChoices))

export async function execute(interaction: ChatInputCommandInteraction) {
	const matchId = interaction.options.getString("match");
	const winner = interaction.options.getString("winner");
	const score = interaction.options.getString("score");

	const dataPath = path.join(process.cwd(), "match.json");
	const rawData = fs.readFileSync(dataPath, "utf8");
	const matchData = JSON.parse(rawData);

	const match = matchData.matches.find((match: any) => match.id === matchId);
	if (!match) {
		await interaction.reply({ content: "Match non trouvé", ephemeral: true });
		return;
	}
	if (match.status !== "not_started") {
		await interaction.reply({ content: "Match déjà commencé ou terminé", ephemeral: true });
		return;
	}

	const existingBet = matchData.bets.find((bet: any) => bet.userId === interaction.user.id && bet.matchId === matchId);
	if (existingBet) {
		await interaction.reply({ content: "Vous avez déjà parié sur ce match", ephemeral: true });
		return;
	}

	matchData.bets.push({
		userId: interaction.user.id,
		matchId: matchId,
		winner: winner,
		score: score
	});

	fs.writeFileSync(dataPath, JSON.stringify(matchData, null, 2));
	await interaction.reply(`✅ Pari placé sur **${match.team1} vs ${match.team2}** : victoire de **${winner}**${score ? ` avec score ${score}` : ""}`);
}
