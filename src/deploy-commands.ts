import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";


dotenv.config();

const commands: any[] = [];
const folderPath = path.join(process.cwd(), "src/commands");
const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".ts"));

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

(async () => {
	for (const file of commandFiles) {
		const filePath = path.join(folderPath, file);
		const command = await import(`./commands/${file}`);
		if ("data" in command && "execute" in command) {
			commands.push(command.data.toJSON());
		}else{
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
	try {
		console.log("Started refreshing application commands.");
		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
		console.log("Successfully reloaded application commands.");
	} catch (error) {
		console.error(error);
	}
})();

