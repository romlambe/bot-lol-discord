import { Client, GatewayIntentBits, Collection, TextChannel } from "discord.js";
import 'dotenv/config'
import fs from "fs";
import path from "path";
import { registerInteractionCreate } from "./events/interactionCreate.js";
import { scheduleAnnouncements } from "./utils/scheduleAnnouncements.js";

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
  }) as any;

  client.commands = new Collection();

  const folderPath = path.join(process.cwd(), "src/commands");
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".ts"));

  for (const file of commandFiles) {
	const filePath = path.join(folderPath, file);
	const command = await import(`./commands/${file}`);
	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
	}
  }

  client.once("ready", () => {
	console.log(`✅ Connecté en tant que ${client.user?.tag}`);

	const channel = client.channels.cache.get(process.env.CHANNEL_ID!) as TextChannel;
	if (channel){
		scheduleAnnouncements(channel);
	}
  });


  client.on("interactionCreate", async (interaction: any) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try{
		await command.execute(interaction);
	}catch(error){
		console.error(error);
		await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
	}
  });

  registerInteractionCreate(client);

  client.login(process.env.DISCORD_TOKEN);
