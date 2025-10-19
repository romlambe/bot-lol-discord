import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Ping the bot');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply('Pong!');
};
