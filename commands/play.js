const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription(`🎶 Play a song from YouTube or Spotify`)
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('The song name or URL')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: `${emojis.music.error} You need to join a voice channel first!`,
        ephemeral: true,
      });
    }

    const sourceEmoji = getSourceEmoji(query);

    const queue = client.distube.getQueue(interaction.guildId);
    const isQueueActive = queue && queue.songs.length > 0;

    if (isQueueActive) {
      await interaction.reply({
        content: `${emojis.music.duration} Searching for: **${query}**...`,
        ephemeral: true
      });
    } else {
      const loadingEmbed = new EmbedBuilder()
        .setColor('#ffae00')
        .setAuthor({
          name: 'Processing your request...',
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(`${sourceEmoji} **Searching for:** \`${query}\``)
        .addFields({
          name: `${emojis.music.repeat} Status`,
          value: `${emojis.music.duration} Searching...`,
        })
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [loadingEmbed] });
    }

    try {
      const options = {
        textChannel: interaction.channel,
        member: interaction.member,
        metadata: { 
          interaction: interaction,
          isQueueActive: isQueueActive
        }
      };

      await client.distube.play(voiceChannel, query, options);
      
    } catch (error) {
      console.error(error);

      if (isQueueActive) {
        await interaction.editReply({
          content: `${emojis.music.error} Failed to add song: **${query}**\n\`\`\`${error.message || 'Unknown error'}\`\`\``,
        });
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor('#ffae00')
          .setTitle(`${emojis.music.error} Error`)
          .setDescription(`Failed to play: \`${query}\`\n\`\`\`${error.message || 'Unknown error'}\`\`\``)
          .setFooter({
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
      }
    }
  },
};

function getSourceEmoji(query) {
  if (query.includes('youtube.com') || query.includes('youtu.be')) return emojis.sources.youtube;
  if (query.includes('spotify.com')) return emojis.sources.spotify;
  return emojis.sources.search;
}