import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getLeaderboard } from "../../db/users";

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Display user rankings')
  .addIntegerOption(option =>
    option.setName('limit')
      .setDescription('Number of users to display (max 20)')
      .setMinValue(5)
      .setMaxValue(20)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const limit = interaction.options.getInteger('limit') || 10;
  const leaderboard = getLeaderboard(limit);

  if (!leaderboard.length) {
    return interaction.reply({
      content: 'No users found in leaderboard.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('Leaderboard')
    .setDescription(`Top ${leaderboard.length} users`);

  for (let i = 0; i < leaderboard.length; i++) {
    const user = leaderboard[i];
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
    
    embed.addFields({
      name: `${medal} ${user.username}`,
      value: `${user.points} points`,
      inline: true
    });
  }

  return interaction.reply({ embeds: [embed] });
}