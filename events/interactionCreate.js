const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`${emojis.music.error} Error in /${interaction.commandName}:`, error);

        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: `${emojis.music.error} Error while executing this command.`, ephemeral: true });
        } else {
          await interaction.reply({ content: `${emojis.music.error} Error while executing this command.`, ephemeral: true });
        }
      }
    }

    if (interaction.isButton()) {
      const musicButtonIds = ['play', 'pause', 'next', 'previous', 'loop'];
      if (!musicButtonIds.includes(interaction.customId)) return;

      const queue = client.distube.getQueue(interaction.guildId);
      if (!queue) {
        return interaction.reply({
          content: `${emojis.music.error} There is no active music queue!`,
          ephemeral: true
        });
      }

      if (!interaction.member.voice.channel) {
        return interaction.reply({
          content: `${emojis.music.error} You need to be in a voice channel to use these controls!`,
          ephemeral: true
        });
      }

      try {
        switch (interaction.customId) {
          case 'pause':
            await queue.pause();
            
            const currentEmbed = interaction.message.embeds[0];
            await interaction.update({
              embeds: [currentEmbed],
              components: [createMusicControlButtons(true, queue.repeatMode)]
            });
            break;

          case 'play':
            await queue.resume();
            
            const playEmbed = interaction.message.embeds[0];
            await interaction.update({
              embeds: [playEmbed],
              components: [createMusicControlButtons(false, queue.repeatMode)]
            });
            break;

          case 'next':
            if (queue.songs.length <= 1) {
              return interaction.reply({
                content: `${emojis.music.error} There are no more songs in the queue!`,
                ephemeral: true
              });
            }
            
            await interaction.deferUpdate();
            
            await queue.skip();
            break;

          case 'previous':
            if (!queue.previousSongs || queue.previousSongs.length === 0) {
              return interaction.reply({
                content: `${emojis.music.error} There are no previous songs!`,
                ephemeral: true
              });
            }
            
            await interaction.deferUpdate();
            
            await queue.previous();
            break;

          case 'loop':
            const nextRepeatMode = (queue.repeatMode + 1) % 3;
            await queue.setRepeatMode(nextRepeatMode);
            
            let modeText = 'Disabled';
            if (nextRepeatMode === 1) modeText = 'Song';
            if (nextRepeatMode === 2) modeText = 'Queue';
            
            const loopEmbed = interaction.message.embeds[0];
            await interaction.update({
              embeds: [loopEmbed],
              components: [createMusicControlButtons(queue.paused, nextRepeatMode)]
            });
            
            await interaction.followUp({
              content: `${emojis.music.repeat} Loop mode: **${modeText}**`,
              ephemeral: true
            });
            break;
        }
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: `${emojis.music.error} Error: ${error.message || 'Unknown error'}`,
          ephemeral: true
        });
      }
    }
  },
};

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
