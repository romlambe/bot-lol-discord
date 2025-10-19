import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Colors } from '../interface/color';

dotenv.config();

export async function deployCommands(discordToken: string, clientId: string, guildId: string, channelId: string) {
  try {
    if (!clientId || !guildId || !discordToken) {
      console.log(`${Colors.Red}[ERROR]: Missing clientId, guildId, or discordToken${Colors.Reset}`);
      return;
    }

    const commands: any[] = [];

    const folderPath = path.join(__dirname, 'commands');
    const commandFiles = fs
      .readdirSync(folderPath)
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = await import(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.log(`${Colors.Red}[ERROR]: Command ${file} is missing data or execute property${Colors.Reset}`);
      }
    }

    const rest = new REST({ version: '10' }).setToken(discordToken);

    console.log(`${Colors.Purple}[BOT]: Refreshing application (/) commands...${Colors.Reset}`);

    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

    console.log(`${Colors.Green}[SUCCESS]: Successfully deployed ${commands.length} commands${Colors.Reset}`);
  } catch (error) {
    console.log(`${Colors.Red}[ERROR]: Failed to deploy commands: ${error}${Colors.Reset}`);
  }
}
