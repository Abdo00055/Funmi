const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  
  async execute(interaction) {
    try {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        return await interaction.reply({
          content: `${emojis.music.error} You need to be in a voice channel to use this command!`,
          ephemeral: true
        });
      }

      const botVoiceChannel = interaction.guild.members.me.voice.channel;
      if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
        return await interaction.reply({
          content: `${emojis.music.error} You need to be in the same voice channel as the bot!`,
          ephemeral: true
        });
      }

      const queue = interaction.client.distube.getQueue(interaction.guildId);
      if (!queue) {
        return await interaction.reply({
          content: `${emojis.music.error} There is no music playing right now!`,
          ephemeral: true
        });
      }

      const currentSong = queue.songs[0];

      if (queue.songs.length <= 1) {
        await queue.stop();

        const embed = new EmbedBuilder()
          .setColor('#ffae00')
          .setTitle(`${emojis.music.next} Song Skipped & Queue Cleared`)
          .setDescription(`**Skipped:** [${currentSong.name}](${currentSong.url})\n**Status:** Queue cleared and playback stopped`)
          .setThumbnail(currentSong.thumbnail)
          .addFields(
            { name: `${emojis.music.user} Skipped by`, value: interaction.user.toString(), inline: true },
            { name: `${emojis.music.queue} Queue Status`, value: 'Cleared', inline: true }
          )
          .setFooter({
            text: `Skipped by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        return await interaction.reply({
          embeds: [embed]
        });
      }

      const nextSong = queue.songs[1];

      await queue.skip();

      const embed = new EmbedBuilder()
        .setColor('#ffae00')
        .setTitle(`${emojis.music.next} Song Skipped`)
        .setDescription(`**Skipped:** [${currentSong.name}](${currentSong.url})\n**Now Playing:** [${nextSong.name}](${nextSong.url})`)
        .setThumbnail(nextSong.thumbnail)
        .addFields(
          { name: `${emojis.music.user} Skipped by`, value: interaction.user.toString(), inline: true },
          { name: `${emojis.music.queue} Songs in Queue`, value: queue.songs.length > 1 ? `${queue.songs.length - 1}` : 'None', inline: true }
        )
        .setFooter({
          text: `Skipped by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in skip command:', error);
      
      if (error.message.includes('No songs') || error.message.includes('queue')) {
        await interaction.reply({
          content: `${emojis.music.error} No songs available to skip!`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `${emojis.music.error} An error occurred while trying to skip the song.`,
          ephemeral: true
        });
      }
    }
  }
};