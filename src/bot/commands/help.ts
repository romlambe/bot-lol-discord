import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Display available commands');

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle('Available Commands')
    .addFields(
      {
        name: '/bet',
        value: 'Display available bet and allow user to choose a result',
        inline: false
      },
      {
        name: '/next [limit]',
        value: 'Display upcoming matches\nLimit: 1-10 matches (default: 5)',
        inline: false
      },
      {
        name: '/current',
        value: 'Display currently live matches with scores and bets',
        inline: false
      },
      {
        name: '/resume [limit] [status]',
        value: 'Display match results and summary\nLimit: 1-15 matches (default: 10)\nStatus: all, finished, live, upcoming',
        inline: false
      },
      {
        name: '/leaderboard [limit]',
        value: 'Display user rankings\nLimit: 5-20 users (default: 10)',
        inline: false
      },
      {
        name: '/help',
        value: 'Display this help message',
        inline: false
      }
    );

  return interaction.reply({ embeds: [embed] });
}