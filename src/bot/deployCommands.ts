import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Colors } from '../interface/color';

dotenv.config();

const commands: any[] = [];

const folderPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.ts'));

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

(async () => {
	for (const file of commandFiles) {
		const filePath = path.join(folderPath, file);
		const command = await import(`./commands/${file}`);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		}else {
			console.log(`${Colors.Red}[ERROR]: Command ${file} is missing data or execute property${Colors.Reset}`);
		}
	}
	try{
		console.log(`${Colors.Yellow}[LOG]: Started refreshing application (/) commands${Colors.Reset}`);
		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
		console.log(`${Colors.Green}[SUCCESS]: Successfully reloaded application (/) commands${Colors.Reset}`);
	}catch(error){
		console.log(`${Colors.Red}[ERROR]: Error refreshing application (/) commands: ${error}${Colors.Reset}`);
	}
})();
