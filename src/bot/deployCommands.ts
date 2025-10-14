import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Colors } from '../interface/color';

dotenv.config();

export async function deployCommands() {
  try {
    const CLIENT_ID = process.env.CLIENT_ID;
    const GUILD_ID = process.env.GUILD_ID;
    const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

    if (!CLIENT_ID || !GUILD_ID || !DISCORD_TOKEN) {
      console.log(`${Colors.Red}[ERROR]: Missing CLIENT_ID, GUILD_ID, or DISCORD_TOKEN${Colors.Reset}`);
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

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    console.log(`${Colors.Purple}[BOT]: Refreshing application (/) commands...${Colors.Reset}`);

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });

    console.log(`${Colors.Green}[SUCCESS]: Successfully deployed ${commands.length} commands${Colors.Reset}`);
  } catch (error) {
    console.log(`${Colors.Red}[ERROR]: Failed to deploy commands: ${error}${Colors.Reset}`);
  }
}
