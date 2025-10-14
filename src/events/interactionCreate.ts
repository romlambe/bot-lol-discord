import { Client, Interaction } from "discord.js";
import fs from "fs";
import path from "path";
import { currentVotes, Vote } from "../tempVotes.js";

const dataPath = path.join(process.cwd(), "data.json");

export function registerInteractionCreate(client: Client) {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    const parts = interaction.customId.split("_");
    const userId = interaction.user.id;

    // Parser le customId correctement
    // Format: "vote_winner_matchId_team" ou "score_matchId_score"
    let type: string;
    let matchId: string;
    let value: string;

    if (parts[0] === "vote" && parts[1] === "winner") {
      type = "vote";
      matchId = parts[2];
      value = parts.slice(3).join("_"); // Au cas où le nom d'équipe contient des "_"
    } else if (parts[0] === "score") {
      type = "score";
      matchId = parts[1];
      value = parts[2];
    } else {
      return; // customId non reconnu
    }

    // Initialiser le tableau de votes pour ce match si inexistant
    if (!currentVotes[matchId]) currentVotes[matchId] = [];

    // Chercher le vote existant de l'utilisateur (temporaire)
    let userVote = currentVotes[matchId].find(v => v.userId === userId) as Vote;

    if (!userVote) {
      userVote = { userId, matchId };
      currentVotes[matchId].push(userVote);
    }

    // Mettre à jour le vote
    if (type === "vote") userVote.winner = value;
    else if (type === "score") userVote.score = value;

    // Vérifier si l'utilisateur a choisi les deux
    if (userVote.winner && userVote.score) {
      // Lire les données existantes pour vérifier si l'utilisateur a déjà voté
      const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      const existingVote = data.votes.find((v: any) => v.userId === userId && v.matchId === matchId);

      // Si l'utilisateur a déjà voté, afficher un message d'erreur
      if (existingVote) {
        // Supprimer le vote temporaire
        currentVotes[matchId] = currentVotes[matchId].filter(v => v.userId !== userId);

        return await interaction.update({
          content: `❌ Vous avez déjà voté pour ce match !\nVotre vote : **${existingVote.winner}** avec le score **${existingVote.score}**`,
          components: []
        });
      }

	  const matchData = data.matches.find((m: any) => m.id === matchId);
		if (matchData && matchData.votesClosed) {
		return interaction.reply({
			content: "❌ Les votes pour ce match sont fermés.",
			ephemeral: true
		});
	}

      // Ajouter le vote final
      data.votes.push({
        userId,
        matchId,
        winner: userVote.winner,
        score: userVote.score
      });

      // Sauvegarder dans data.json
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

      // Envoyer confirmation
      await interaction.update({
        content: `✅ Votre vote pour **${userVote.winner}** avec score **${userVote.score}** a été enregistré !`,
        components: []
      });

      // Supprimer le vote temporaire
      currentVotes[matchId] = currentVotes[matchId].filter(v => v.userId !== userId);
    } else {
      // Si pas encore complet, on défère juste l'interaction
      await interaction.deferUpdate();
    }
  });
}
