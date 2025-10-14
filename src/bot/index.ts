import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { Colors } from '../interface/color';
import fs from 'fs';
import path from 'path';

export const startBot = async () => {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as any;
  client.commands = new Collection();

  // Load commands
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = await import(`./commands/${file.replace('.ts', '').replace('.js', '')}`);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`${Colors.Cyan}[COMMAND]: Loaded command ${command.data.name}${Colors.Reset}`);
    }
  }

  client.on('ready', () => {
    console.log(`${Colors.Green}[SUCCESS]: Discord Bot started as ${client.user?.tag}${Colors.Reset}`);
  });

  // Handle slash command interactions
  client.on(Events.InteractionCreate, async (interaction: any) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`${Colors.Red}[ERROR]: No command matching ${interaction.commandName} was found.${Colors.Reset}`);
      return;
    }

    try {
      await command.execute(interaction);
      console.log(`${Colors.Green}[SUCCESS]: Executed command ${interaction.commandName}${Colors.Reset}`);
    } catch (error) {
      console.error(`${Colors.Red}[ERROR]: Error executing command ${interaction.commandName}:${Colors.Reset}`, error);

      const errorMessage = { content: 'There was an error while executing this command!', ephemeral: true };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  });

  await client.login(process.env.DISCORD_TOKEN);

  return client;
};
