import { SlashCommandBuilder } from "discord.js";
import { getBetsForMatch, getCurrentMatch } from "../../db/matchDb";
import { EmbedBuilder } from "@discordjs/builders";
import { Match } from "../../interface/match";

export const data = new SlashCommandBuilder()
  .setName('current')
  .setDescription('Affiche le match actuellement en cours et les paris associés.');

export async function execute(interaction) {
  
  const match = getCurrentMatch() as Match;

  if (!match) {
    return interaction.reply({
      content: 'No match for the moment.',
      ephemeral: true,
    });
  }

//   GET CURRENT MATCH

  const embed = new EmbedBuilder()
    .setTitle(`${match.team1} 🆚 ${match.team2}`)
    .setDescription(`BO${match.bo_count} | Started ${new Date(match.begin_at).toLocaleString('fr-FR')}`)
    .addFields(
      { name: 'Tournament', value: match.tournament || 'Inconnu', inline: true },
      { name: 'Score', value: `${match.score_team1} - ${match.score_team2}`, inline: true },
      { name: 'Status', value: match.status, inline: true },
    )

// GET BETS

  const bets = getBetsForMatch(match.pandascore_id);

  if (bets.length) {
    const betList = bets
      .map(bet => `• <@${bet.username}> a parié **${bet.amount}** sur **${bet.team_choice}**`)
      .join('\n');

    embed.addFields({ name: 'Current bet', value: betList });
  } else {
    embed.addFields({ name: 'Current bet', value: 'No bet registered for this match' });
  }

  return interaction.reply({ embeds: [embed] });
}