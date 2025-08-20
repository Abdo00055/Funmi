const { REST, Routes, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../utils/emojis.json');

const { mainMusicMessage } = require('../utils/state.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`${emojis.music.success} ${client.user.tag} is online!`);

    client.user.setPresence({
      status: 'online',
      activities: [{
        name: 'music || /help',
        type: ActivityType.Listening,
      }],
    });


    try {
      const distubeHandler = require('./distube.js');
      distubeHandler(client);
      console.log(`✅ DisTube event handler initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize DisTube event handler:`, error);
    }

    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if (command.data) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(`⚠️ Command ${file} is missing 'data'`);
      }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
      console.log(`🔃 Updating global slash commands...`);

      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );

      console.log(`✅ Registered ${commands.length} global command(s) successfully.`);
    } catch (error) {
      console.error('❌ Failed to register commands:', error);
    }

client.on('voiceStateUpdate', async (oldState, newState) => {
  const queue = client.distube.getQueue(oldState.guild.id);
  if (!queue) return;

  const botVoiceChannel = oldState.guild.members.me?.voice.channel;
  if (!botVoiceChannel) return;

  const humanMembers = botVoiceChannel.members.filter(member => !member.user.bot);

  if (humanMembers.size === 0) {
    console.log(`[⚠️] No users in ${botVoiceChannel.name}, waiting 20s before disconnect...`);

    setTimeout(async () => {
      const updatedChannel = await client.channels.fetch(botVoiceChannel.id);
      const stillEmpty = updatedChannel.members.filter(member => !member.user.bot).size === 0;

      if (stillEmpty) {
        try {
          console.log(`[⏹️] Still empty. Stopping queue & leaving ${oldState.guild.name}.`);

          await queue.stop();

          const mainMessage = mainMusicMessage.get(queue.id || queue.textChannel.guild.id);
          if (mainMessage) {
            const channel = await client.channels.fetch(mainMessage.channelId);
            const message = await channel.messages.fetch(mainMessage.messageId);

            await message.edit({
              content: `${emojis.music.warning} Left voice channel because it's empty.`,
              embeds: [],
              components: []
            });

            mainMusicMessage.delete(queue.id || queue.textChannel.guild.id);
          }

          const voice = client.distube.voices.get(queue.id || queue.textChannel.guild.id);
          if (voice && voice.connection && voice.connection.state.status !== 'destroyed') {
            voice.connection.destroy();
          }

        } catch (err) {
          console.error(`❌ Error disconnecting after delay:`, err);
        }
      } else {
        console.log(`[✅] User rejoined. Cancelled disconnect.`);
      }
    }, 20000);
  }
});
  },
};
