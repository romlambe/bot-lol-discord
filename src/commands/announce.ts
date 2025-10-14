import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from "discord.js";
import { announceMatch } from "../utils/announceMatch.js";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data.json");

export const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Annonce un match et ouvre les votes")
  .addStringOption(option =>
    option.setName("match")
      .setDescription("ID du match à annoncer")
      .setRequired(true)
  )
  .addChannelOption(option =>
    option.setName("channel")
      .setDescription("Channel où envoyer le message")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const matchId = interaction.options.getString("match", true);
  const channel = interaction.options.getChannel("channel", true);

  if (!channel || !("send" in channel)) {
    return interaction.reply({ content: "Le channel spécifié est invalide.", ephemeral: true });
  }

  // Lire les matchs
  const rawData = fs.readFileSync(dataPath, "utf8");
  const dataJson = JSON.parse(rawData);

  const match = dataJson.matches.find((m: any) => m.id === matchId);
  if (!match) return interaction.reply({ content: "Match non trouvé.", ephemeral: true });

  // Envoyer le message avec les boutons
  await announceMatch(channel as TextChannel, match);

  await interaction.reply({ content: `✅ Message d'annonce envoyé pour ${match.team1} vs ${match.team2}`, ephemeral: true });
}
