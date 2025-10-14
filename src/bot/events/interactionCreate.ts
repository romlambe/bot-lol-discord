// import { Client, Interaction } from 'discord.js';
// import fs from 'fs';
// import path from 'path';
// import { getMatchNotStarted } from '../../db/matchDb';
// import { getMatchBets } from '../../db/betDb';
// import { currentVotes, Vote } from '../utils/tempsVote';

// const matches = getMatchNotStarted();

// export function interactionCreate(client: Client) {
// 	client.on("interactionCreate"), async(interaction: Interaction) => {
// 		if (!interaction.isButton()) return;

// 		const parts = interaction.customId.split("_");
// 		const userId = interaction.user.id;

// 		let type: string;
// 		let matchId: number;
// 		let value: string;

// 		if (parts[0] === "vote" && parts[1] === "winner") {
// 			type = "vote";
// 			matchId = parseInt(parts[2]);
// 			value = parts.slice(3).join("_");
// 		}else if (parts[0] === "score") {
// 			type = "score";
// 			matchId = parseInt(parts[1]);
// 			value = parts[2];
// 		}else {
// 			return;
// 		}

// 		if (!currentVotes[matchId]) currentVotes[matchId] = [];

// 		let userVotes = currentVotes[matchId].find(v => v.userId === userId) as Vote;

// 		if (!userVotes) {
// 			userVotes = { userId, matchId: matchId.toString() };
// 			currentVotes[matchId].push(userVotes);
// 		}

// 		if (type === "vote") userVotes.winner = value;
// 		else if (type === "score") userVotes.score = value;


		// Check si le user a déjà voté pour le vainqueur et le score
		// if (userVotes.winner && userVotes.score) {
		// 	const bet = getMatchBets(matchId);
		// 	if (bet){
		// 		currentVotes[matchId] = currentVotes[matchId].filter(v => v.userId !== userId);
		// 		return await interaction.reply({ content: "Vous avez déjà voté pour ce match", ephemeral: true });
		// 	}
		// }



		// const match = matches.find(each => each.id === matchId);
		// if (!match) return;

		// const bet = getMatchBets(matchId);
		// if (!bet) return;


// 	}
// }
