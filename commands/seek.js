const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Seek to a specific time in the current song')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Time to seek to (e.g., 90, 1:30, 2m, 30s, 2m30s)')
        .setRequired(true)
    ),
  
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

      if (!queue.playing) {
        return await interaction.reply({
          content: `${emojis.music.error} Music is not currently playing!`,
          ephemeral: true
        });
      }

      const timeInput = interaction.options.getString('time');
      const seekTime = parseTimeToSeconds(timeInput);

      if (seekTime === null) {
        return await interaction.reply({
          content: `${emojis.music.error} Invalid time format! Use formats like: \`90\`, \`1:30\`, \`2m\`, \`30s\`, \`2m30s\``,
          ephemeral: true
        });
      }

      const currentSong = queue.songs[0];
      const songDuration = currentSong.duration;

      if (seekTime > songDuration) {
        return await interaction.reply({
          content: `${emojis.music.error} Cannot seek beyond song duration (${formatTime(songDuration)})!`,
          ephemeral: true
        });
      }

      if (seekTime < 0) {
        return await interaction.reply({
          content: `${emojis.music.error} Cannot seek to negative time!`,
          ephemeral: true
        });
      }

      await queue.seek(seekTime);

      const embed = new EmbedBuilder()
        .setColor('#ffae00')
        .setTitle(`${emojis.music.duration} Seeked to Position`)
        .setDescription(`**[${currentSong.name}](${currentSong.url})**`)
        .setThumbnail(currentSong.thumbnail)
        .addFields(
          { name: `${emojis.music.duration} Seeked to`, value: formatTime(seekTime), inline: true },
          { name: `${emojis.music.duration} Song Duration`, value: currentSong.formattedDuration || formatTime(songDuration), inline: true },
          { name: `${emojis.music.user} Seeked by`, value: interaction.user.toString(), inline: true }
        )
        .setFooter({
          text: `Seeked by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in seek command:', error);
      
      if (error.message.includes('Cannot seek')) {
        await interaction.reply({
          content: `${emojis.music.error} Cannot seek in this song (may be a live stream or unsupported format)!`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `${emojis.music.error} An error occurred while trying to seek in the song.`,
          ephemeral: true
        });
      }
    }
  }
};

function parseTimeToSeconds(timeString) {
  try {
    timeString = timeString.trim();
    
    if (/^\d+$/.test(timeString)) {
      return parseInt(timeString);
    }
    
    const minutesMatch = timeString.match(/^(\d+)m$/);
    if (minutesMatch) {
      return parseInt(minutesMatch[1]) * 60;
    }
    
    const secondsMatch = timeString.match(/^(\d+)s$/);
    if (secondsMatch) {
      return parseInt(secondsMatch[1]);
    }
    
    const minutesSecondsMatch = timeString.match(/^(\d+)m(\d+)s$/);
    if (minutesSecondsMatch) {
      const minutes = parseInt(minutesSecondsMatch[1]);
      const seconds = parseInt(minutesSecondsMatch[2]);
      if (seconds >= 60) return null;
      return minutes * 60 + seconds;
    }
    
    const timeRegex = /^(?:(\d+):)?(\d+):(\d+)$|^(\d+):(\d+)$/;
    const match = timeString.match(timeRegex);
    
    if (!match) {
      return null;
    }
    
    let hours = 0, minutes = 0, seconds = 0;
    
    if (match[1] !== undefined) {
      hours = parseInt(match[1]) || 0;
      minutes = parseInt(match[2]) || 0;
      seconds = parseInt(match[3]) || 0;
    } else {
      minutes = parseInt(match[4]) || 0;
      seconds = parseInt(match[5]) || 0;
    }
    
    if (seconds >= 60 || minutes >= 60) {
      return null;
    }
    
    return hours * 3600 + minutes * 60 + seconds;
  } catch (error) {
    return null;
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}