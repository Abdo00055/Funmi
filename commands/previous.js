const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('previous')
    .setDescription('Go back to the previous song'),
  
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

      if (!queue.previousSongs || queue.previousSongs.length === 0) {
        return await interaction.reply({
          content: `${emojis.music.error} There is no previous song to go back to!`,
          ephemeral: true
        });
      }

      const currentSong = queue.songs[0];
      const previousSong = queue.previousSongs[queue.previousSongs.length - 1];

      await queue.previous();

      const embed = new EmbedBuilder()
        .setColor('#ffae00')
        .setTitle(`${emojis.music.previous} Went Back to Previous Song`)
        .setDescription(`**Previous:** [${currentSong.name}](${currentSong.url})\n**Now Playing:** [${previousSong.name}](${previousSong.url})`)
        .setThumbnail(previousSong.thumbnail)
        .addFields(
          { name: `${emojis.music.user} Requested by`, value: interaction.user.toString(), inline: true },
          { name: `${emojis.music.duration} Duration`, value: previousSong.formattedDuration || 'Unknown', inline: true },
          { name: `${emojis.music.queue} Songs in Queue`, value: queue.songs.length > 1 ? `${queue.songs.length - 1}` : 'None', inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in previous command:', error);
      
      if (error.message.includes('No previous song') || error.message.includes('previous')) {
        await interaction.reply({
          content: `${emojis.music.error} There is no previous song to go back to!`,
          ephemeral: true
        });
      } else if (error.message.includes('Cannot go back')) {
        await interaction.reply({
          content: `${emojis.music.error} Cannot go back to the previous song at this time!`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `${emojis.music.error} An error occurred while trying to go to the previous song.`,
          ephemeral: true
        });
      }
    }
  }
};