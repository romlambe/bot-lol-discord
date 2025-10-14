import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUsersByPoints } from "../../db/userDb";

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Affiche le classement des utilisateurs');

export async function execute(interaction) {
  const users = getUsersByPoints();
  const embed = new EmbedBuilder()
    .setTitle('Classement')
    .setDescription('Voici le classement des utilisateurs');

	for (const user of users) {
		embed.addFields({
			name: user.username,
			value: user.points.toString(),
		});
	}

	return interaction.reply({ embeds: [embed] });
}
