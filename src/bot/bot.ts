import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { Colors } from '../interface/color';
import fs from 'fs';
import path from 'path';
import { scheduleAnnouncements } from './utils/scheduleAnnouncement';
import { handleButtonInteraction, cleanupBets } from './events/handleButtonInteraction';

export const startBot = async (channelId: string, discordToken: string) => {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as any;
  client.commands = new Collection();

  // Load commands
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    try {
      const command = await import(`./commands/${file.replace('.ts', '').replace('.js', '')}`);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`${Colors.Purple}[BOT]: Loaded command ${command.data.name}${Colors.Reset}`);
      }
    } catch (error) {
      console.error(`${Colors.Red}[ERROR]: Failed to load command ${file}: ${error}${Colors.Reset}`);
    }
  }

  client.on('ready', async () => {
    console.log(`${Colors.Purple}[BOT]: Discord Bot started as ${client.user?.tag}${Colors.Reset}`);

    if (!channelId) {
      console.log(`${Colors.Red}[ERROR]: channelId missing in .env${Colors.Reset}`);
      return;
    }

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) {
        console.log(`${Colors.Red}[ERROR]: Channel ${channelId} not found${Colors.Reset}`);
        return;
      }
      console.log(`${Colors.Green}[BOT]: Connected to channel ${channelId}${Colors.Reset}`);
      
      scheduleAnnouncements(channel as any);
      console.log(`${Colors.Green}[BOT]: Match announcements scheduler started${Colors.Reset}`);
      
      // Nettoyage périodique des paris incomplets
      setInterval(() => {
        cleanupBets();
      },  60 * 1000);
      
    } catch (error) {
      console.error(`${Colors.Red}[ERROR]: Failed to fetch channel: ${error}${Colors.Reset}`);
    }
  });

  // Handle interactions
  client.on(Events.InteractionCreate, async (interaction: any) => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`${Colors.Red}[ERROR]: No command matching ${interaction.commandName} was found.${Colors.Reset}`);
        return;
      }

      try {
        await command.execute(interaction);
        console.log(`${Colors.Green}[SUCCESS]: Executed command ${interaction.commandName} by ${interaction.user.tag}${Colors.Reset}`);
      } catch (error) {
        console.error(`${Colors.Red}[ERROR]: Error executing command ${interaction.commandName}:${Colors.Reset}`, error);

        const errorMessage = { 
          content: 'An error occurred while executing this command!', 
          ephemeral: true 
        };

        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (followUpError) {
          console.error(`${Colors.Red}[ERROR]: Failed to send error message: ${followUpError}${Colors.Reset}`);
        }
      }
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
      try {
        await handleButtonInteraction(interaction);
        console.log(`${Colors.Blue}[BUTTON]: ${interaction.user.tag} clicked ${interaction.customId}${Colors.Reset}`);
      } catch (error) {
        console.error(`${Colors.Red}[ERROR]: Button interaction error:${Colors.Reset}`, error);
        
        try {
          await interaction.reply({
            content: 'An error occurred while processing your bet.',
            ephemeral: true
          });
        } catch (replyError) {
          console.error(`${Colors.Red}[ERROR]: Failed to send button error message: ${replyError}${Colors.Reset}`);
        }
      }
    }
  });

  await client.login(discordToken);

  return client;
};