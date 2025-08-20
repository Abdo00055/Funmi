const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show information about the currently playing song'),
  
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
      const sourceEmoji = getSourceEmoji(currentSong.url);

      const currentTime = queue.currentTime;
      const totalTime = currentSong.duration;
      const progressPercentage = (currentTime / totalTime) * 100;
      const progressBar = createProgressBar(progressPercentage);

      const queueStatus = getQueueStatus(queue);
      const volumeEmoji = getVolumeEmoji(queue.volume);

      const embed = new EmbedBuilder()
        .setColor('#ffae00')
        .setTitle(`${sourceEmoji} Now Playing`)
        .setDescription(`**[${currentSong.name}](${currentSong.url})**`)
        .setImage(currentSong.thumbnail)
        .addFields(
          { name: `${emojis.music.user} Requested by`, value: currentSong.user ? currentSong.user.toString() : 'Unknown', inline: true },
          { name: `${emojis.music.duration} Duration`, value: currentSong.formattedDuration || 'Unknown', inline: true },
          { name: `${volumeEmoji} Volume`, value: `${queue.volume}%`, inline: true },
          { name: `${emojis.music.queue} Queue`, value: queue.songs.length > 1 ? `${queue.songs.length - 1} songs` : 'Empty', inline: true },
          { name: `${emojis.music.repeat} Repeat Mode`, value: getRepeatModeText(queue.repeatMode), inline: true },
          { name: `${emojis.music.stop} Status`, value: queue.paused ? 'Paused' : 'Playing', inline: true },
          { name: `${emojis.music.duration} Progress`, value: `${formatTime(currentTime)} / ${formatTime(totalTime)}\n${progressBar}`, inline: false }
        )
        .setFooter({
          text: currentSong.user ? `Requested by ${currentSong.user.tag}` : 'Now Playing',
          iconURL: currentSong.user ? currentSong.user.displayAvatarURL() : interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

      if (queue.songs.length > 1) {
        const nextSong = queue.songs[1];
        embed.addFields({
          name: `${emojis.music.next} Up Next`,
          value: `**[${nextSong.name}](${nextSong.url})**\n${nextSong.user ? `Requested by ${nextSong.user.tag}` : 'Unknown'}`,
          inline: false
        });
      }

      const row = createMusicControlButtons(queue.paused, queue.repeatMode);

      await interaction.reply({
        embeds: [embed],
        components: [row]
      });

    } catch (error) {
      console.error('Error in nowplaying command:', error);
      
      await interaction.reply({
        content: `${emojis.music.error} An error occurred while fetching the current song information.`,
        ephemeral: true
      });
    }
  }
};

function getSourceEmoji(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return emojis.sources.youtube;
  if (url.includes('spotify.com')) return emojis.sources.spotify;
  return emojis.sources.search;
}

function getVolumeEmoji(volume) {
  if (volume === 0) return `${emojis.music.volume}`;
  if (volume <= 30) return `${emojis.music.volume}`;
  if (volume <= 70) return `${emojis.music.volume}`;
  return `${emojis.music.volume}`;
}

function getRepeatModeText(repeatMode) {
  if (repeatMode === 0) return 'Off';
  if (repeatMode === 1) return 'Song';
  if (repeatMode === 2) return 'Queue';
  return 'Off';
}

function getQueueStatus(queue) {
  if (queue.paused) return 'Paused';
  if (queue.playing) return 'Playing';
  return 'Stopped';
}

function createProgressBar(percentage) {
  const barLength = 20;
  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  const filledBar = '█'.repeat(filledLength);
  const emptyBar = '░'.repeat(emptyLength);
  
  return `\`${filledBar}${emptyBar}\` ${Math.round(percentage)}%`;
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