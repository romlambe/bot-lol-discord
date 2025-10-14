import { Client, EmbedBuilder, Interaction } from 'discord.js';
import { getMatchNotStarted } from '../../db/matchDb';
import { getMatchBets, createOrUpdateBet } from '../../db/betDb';
import { currentVotes, Vote } from '../utils/tempsVote';
import { getUserByDiscordId, upsertUser } from '../../db/userDb';

const matches = getMatchNotStarted();

export function interactionCreate(client: Client) {
	client.on("interactionCreate", async(interaction: Interaction) => {
		if (!interaction.isButton()) return;

		const parts = interaction.customId.split("_");
		const userId = interaction.user.id;

		let type: string;
		let matchId: number;
		let value: string;

		if (parts[0] === "vote" && parts[1] === "winner") {
			type = "vote";
			matchId = parseInt(parts[2]);
			value = parts.slice(3).join("_");
		}else if (parts[0] === "score") {
			type = "score";
			matchId = parseInt(parts[1]);
			value = parts[2];
		}else {
			return;
		}

		if (!currentVotes[matchId]) currentVotes[matchId] = [];

		let userVotes = currentVotes[matchId].find(v => v.userId === userId) as Vote;

		if (!userVotes) {
			userVotes = { userId, matchId: matchId.toString() };
			currentVotes[matchId].push(userVotes);
		}

		if (type === "vote") userVotes.winner = value;
		else if (type === "score") userVotes.score = value;


		// Check si le user a complété son vote (gagnant + score)
		if (userVotes.winner && userVotes.score) {
			// Vérifier si l'utilisateur a déjà parié sur ce match
			const existingBets = getMatchBets(matchId);
			const userAlreadyBet = existingBets.find(bet => bet.discord_id === userId);

			if (userAlreadyBet) {
				currentVotes[matchId] = currentVotes[matchId].filter(v => v.userId !== userId);
				return await interaction.reply({ content: "Vous avez déjà voté pour ce match", ephemeral: true });
			}

			// Récupérer ou créer l'utilisateur dans la DB
			upsertUser(userId, interaction.user.username);
			const user = getUserByDiscordId(userId) as any;

			// Extraire le nombre du score (ex: "3-0" -> 3)
			// const boCount = parseInt(userVotes.score.split('-')[0]);

			// Sauvegarder le pari dans la base de données
			createOrUpdateBet(user.id, matchId, userVotes.winner, userVotes.score);

			// Nettoyer le vote temporaire
			currentVotes[matchId] = currentVotes[matchId].filter(v => v.userId !== userId);

			const confirmEmbed = new EmbedBuilder()
			.setColor(0x00FF00) // Vert
			.setTitle('✅ Pari enregistré !')
			.addFields(
				{ name: '🏆 Gagnant prédit', value: userVotes.winner, inline: true },
				{ name: '📊 Score prédit', value: userVotes.score, inline: true }
			)
			.setFooter({ text: 'Bonne chance !' })
			.setTimestamp();

			// Confirmer à l'utilisateur
			await interaction.reply({
				embeds: [confirmEmbed],
				ephemeral: true
			});
		} else {
			const message = interaction.message;
			const components = message.components;

			const updatedComponents = components.map((row: any) => {
				const buttons = row.components.map((button: any) => {
					const newButton = {
						type: button.type,
						custom_id: button.customId,
						label: button.label,
						style: button.style,
					};

					if (button.customId === interaction.customId) {
						newButton.style = 3;
					}

					return newButton;
				});

				return {
					type: 1,
					components: buttons,
				};
			});
			await interaction.update({
				components: updatedComponents,
			});
		}
	});
}
