const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../utils/emojis.json');

const { mainMusicMessage } = require('../utils/state.js');

module.exports = (client) => {
  // Store reference to web server for broadcasting updates
  let webServer = null;
  
  // Get web server reference when it's available
  client.once('ready', () => {
    setTimeout(() => {
      webServer = client.webServer;
    }, 1000);
  });
  client.distube.on('addSong', async (queue, song) => {
    const interaction = song.metadata?.interaction;
    const isQueueActive = song.metadata?.isQueueActive;
    
    if (!interaction) return;

    try {
      const sourceEmoji = getSourceEmoji(song.url);
      
      if (!isQueueActive) {
        const embed = new EmbedBuilder()
          .setColor('#ffae00')
          .setTitle(`${sourceEmoji} Now Playing`)
          .setDescription(`**[${song.name}](${song.url})**`)
          .setImage(song.thumbnail)
          .addFields(
            { name: `${emojis.music.user} Requested by`, value: interaction.user.toString(), inline: true },
            { name: `${emojis.music.duration} Duration`, value: song.formattedDuration || 'Unknown', inline: true },
            { name: `${emojis.music.queue} Songs in Queue`, value: queue.songs.length > 1 ? `${queue.songs.length - 1}` : 'None', inline: true }
          )
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTimestamp();

        const row = createMusicControlButtons(queue.paused, queue.repeatMode);

        const reply = await interaction.editReply({ 
          embeds: [embed],
          components: [row]
        });

        mainMusicMessage.set(queue.id || interaction.guildId, {
          channelId: interaction.channelId,
          messageId: reply.id,
          interaction: interaction
        });

        // Broadcast to web clients
        if (webServer) {
          webServer.broadcastQueueUpdate(interaction.guildId, queue);
        }
      } else {
        const position = queue.songs.indexOf(song) + 1;
        await interaction.editReply({
          content: `${emojis.music.success} Added **${song.name}** to queue at position #${position}`,
        });
      }
    } catch (err) {
      console.error("Error sending add song embed:", err);
    }
  });

  client.distube.on('playSong', async (queue, song) => {
    try {
      if (queue.songs.length === 1 && queue.songs[0].id === song.id && song.metadata?.isQueueActive === false) {
        return;
      }

      const sourceEmoji = getSourceEmoji(song.url);
      
      const embed = new EmbedBuilder()
        .setColor('#ffae00')
        .setTitle(`${sourceEmoji} Now Playing`)
        .setDescription(`**[${song.name}](${song.url})**`)
        .setImage(song.thumbnail)
        .addFields(
          { name: `${emojis.music.user} Requested by`, value: song.user ? song.user.toString() : 'Unknown', inline: true },
          { name: `${emojis.music.duration} Duration`, value: song.formattedDuration || 'Unknown', inline: true },
          { name: `${emojis.music.queue} Songs in Queue`, value: queue.songs.length > 1 ? `${queue.songs.length - 1}` : 'None', inline: true }
        )
        .setFooter({
          text: song.user ? `Requested by ${song.user.tag}` : 'Now Playing',
          iconURL: song.user ? song.user.displayAvatarURL() : client.user.displayAvatarURL(),
        })
        .setTimestamp();

      const row = createMusicControlButtons(queue.paused, queue.repeatMode);

      const mainMessage = mainMusicMessage.get(queue.id || queue.textChannel.guild.id);
      if (mainMessage) {
        try {
          const channel = await client.channels.fetch(mainMessage.channelId);
          const message = await channel.messages.fetch(mainMessage.messageId);
          
          await message.edit({
            embeds: [embed],
            components: [row]
          });
          return;
        } catch (err) {
          console.error("Could not update main music message:", err);
        }
      }
      
      if (queue.textChannel) {
        const message = await queue.textChannel.send({
          embeds: [embed],
          components: [row]
        });
        
        mainMusicMessage.set(queue.id || queue.textChannel.guild.id, {
          channelId: queue.textChannel.id,
          messageId: message.id
        });
      }

      // Broadcast to web clients
      if (webServer) {
        webServer.broadcastQueueUpdate(queue.textChannel.guild.id, queue);
      }
    } catch (err) {
      console.error("Error sending now playing embed:", err);
    }
  });

  client.distube.on('skip', async (queue) => {
  });


  client.distube.on('empty', async (queue) => {
    try {
      const mainMessage = mainMusicMessage.get(queue.id || queue.textChannel.guild.id);
      if (mainMessage) {
        const channel = await client.channels.fetch(mainMessage.channelId);
        const message = await channel.messages.fetch(mainMessage.messageId);

        await message.edit({
          content: `${emojis.music.warning} Voice channel is empty. Music playback has been stopped.`,
          embeds: [],
          components: []
        });

        mainMusicMessage.delete(queue.id || queue.textChannel.guild.id);
      }

      const voice = queue.voice || client.distube.voices.get(queue.id || queue.textChannel.guild.id);
      if (voice && voice.connection && voice.connection.state.status !== 'destroyed') {
        voice.connection.destroy();
      }
    } catch (err) {
      console.error("Error updating message on empty queue:", err);
    }
  });

  client.distube.on('finish', async (queue) => {
    try {
      const mainMessage = mainMusicMessage.get(queue.id || queue.textChannel.guild.id);
      if (mainMessage) {
        const channel = await client.channels.fetch(mainMessage.channelId);
        const message = await channel.messages.fetch(mainMessage.messageId);
        
        await message.edit({
          content: `${emojis.music.queue} Queue finished! and i discconnected from the voice channel.`,
          embeds: [],
          components: []
        });
        
        mainMusicMessage.delete(queue.id || queue.textChannel.guild.id);
      }

      

      const voice = queue.voice || client.distube.voices.get(queue.id || queue.textChannel.guild.id);
      if (voice && voice.connection && voice.connection.state.status !== 'destroyed') {
        voice.connection.destroy();
      }

    } catch (err) {
      console.error("Error updating message on finish:", err);
    }
  });

  client.distube.on('error', (channel, error) => {
    console.error("DisTube error:", error);
    if (channel) channel.send(`${emojis.music.error} Error: ${error.message || "Unknown error"}`);
  });
};

function getSourceEmoji(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return emojis.sources.youtube;
  if (url.includes('spotify.com')) return emojis.sources.spotify;
  return emojis.sources.search;
}

function createMusicControlButtons(isPaused, repeatMode) {
  let loopLabel = 'Off';
  let loopEmoji = emojis.music.repeat;
  let loopStyle = ButtonStyle.Secondary;
  
  if (repeatMode === 0) {
    loopLabel = 'Off';
    loopEmoji = emojis.music.repeat;
    loopStyle = ButtonStyle.Secondary;
  } else if (repeatMode === 1) {
    loopLabel = 'Song';
    loopEmoji = emojis.music.repeatOne;
    loopStyle = ButtonStyle.Success;
  } else if (repeatMode === 2) {
    loopLabel = 'Queue';
    loopEmoji = emojis.music.repeatQueue;
    loopStyle = ButtonStyle.Primary;
  }

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('previous')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis.music.previous),
      new ButtonBuilder()
        .setCustomId(isPaused ? 'play' : 'pause')
        .setLabel(isPaused ? 'Play' : 'Pause')
        .setStyle(ButtonStyle.Success)
        .setEmoji(isPaused ? emojis.music.play : emojis.music.pause),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis.music.next),
      new ButtonBuilder()
        .setCustomId('loop')
        .setLabel(loopLabel)
        .setStyle(loopStyle)
        .setEmoji(loopEmoji)
    );
  
  return row;
}