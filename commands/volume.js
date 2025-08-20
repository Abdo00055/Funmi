const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Adjust or check the current volume')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Volume level (0-100)')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(false)
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

      const volumeLevel = interaction.options.getInteger('level');

      if (volumeLevel === null) {
        const currentVolume = queue.volume;
        const volumeEmoji = getVolumeEmoji(currentVolume);
        
        const embed = new EmbedBuilder()
          .setColor('#ffae00')
          .setTitle(`${volumeEmoji} Current Volume`)
          .setDescription(`**Volume:** ${currentVolume}%`)
          .addFields(
            { name: `${emojis.music.user} Requested by`, value: interaction.user.toString(), inline: true },
            { name: '📊 Volume Bar', value: createVolumeBar(currentVolume), inline: false }
          )
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();

        return await interaction.reply({
          embeds: [embed]
        });
      }

      const oldVolume = queue.volume;
      
      queue.setVolume(volumeLevel);
      
      const volumeEmoji = getVolumeEmoji(volumeLevel);
      const changeEmoji = volumeLevel > oldVolume ? '📈' : volumeLevel < oldVolume ? '📉' : '🔄';
      
      const embed = new EmbedBuilder()
        .setColor('#ffae00')
        .setTitle(`${volumeEmoji} Volume ${getVolumeAction(volumeLevel, oldVolume)}`)
        .setDescription(`**Volume:** ${oldVolume}% → ${volumeLevel}%`)
        .addFields(
          { name: `${emojis.music.user} Changed by`, value: interaction.user.toString(), inline: true },
          { name: `${changeEmoji} Change`, value: `${volumeLevel > oldVolume ? '+' : ''}${volumeLevel - oldVolume}%`, inline: true },
          { name: '📊 Volume Bar', value: createVolumeBar(volumeLevel), inline: false }
        )
        .setFooter({
          text: `Changed by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();



      await interaction.reply({
        embeds: [embed]
      });

    } catch (error) {
      console.error('Error in volume command:', error);
      
      await interaction.reply({
        content: `${emojis.music.error} An error occurred while trying to adjust the volume.`,
        ephemeral: true
      });
    }
  }
};

function getVolumeEmoji(volume) {
  if (volume === 0) return '🔇';
  if (volume <= 30) return '🔉';
  if (volume <= 70) return '🔊';
  return '📢';
}

function getVolumeAction(newVolume, oldVolume) {
  if (newVolume > oldVolume) return 'Increased';
  if (newVolume < oldVolume) return 'Decreased';
  return 'Set';
}

function createVolumeBar(volume) {
  const barLength = 20;
  const filledLength = Math.round((volume / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  const filledBar = '█'.repeat(filledLength);
  const emptyBar = '░'.repeat(emptyLength);
  
  return `\`${filledBar}${emptyBar}\` ${volume}%`;
}

function createDetailedVolumeBar(volume) {
  const segments = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const barLength = 10;
  let bar = '';
  
  for (let i = 0; i < barLength; i++) {
    const segmentValue = ((i + 1) / barLength) * 100;
    if (volume >= segmentValue) {
      bar += segments[7]; // Full segment
    } else if (volume >= segmentValue - 10) {
      const partial = Math.floor(((volume - (segmentValue - 10)) / 10) * 8);
      bar += segments[Math.max(0, partial)];
    } else {
      bar += segments[0]; // Empty segment
    }
  }
  
  return `${bar} ${volume}%`;
}