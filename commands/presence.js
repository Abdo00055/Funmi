const { SlashCommandBuilder, ActivityType } = require('discord.js');
const emojis = require('../utils/emojis.json');

const activityMap = {
  playing: ActivityType.Playing,
  streaming: ActivityType.Streaming,
  listening: ActivityType.Listening,
  watching: ActivityType.Watching,
  competing: ActivityType.Competing,
  custom: ActivityType.Custom,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('presence')
    .setDescription(`🤖 Change the bot status and activity (developer only)`)
    .setDefaultMemberPermissions(0)
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Bot status')
        .setRequired(true)
        .addChoices(
          { name: 'Online', value: 'online' },
          { name: 'Idle', value: 'idle' },
          { name: 'Do Not Disturb', value: 'dnd' },
          { name: 'Invisible', value: 'invisible' },
        )
    )
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Activity type')
        .setRequired(true)
        .addChoices(
          { name: 'Playing', value: 'playing' },
          { name: 'Streaming', value: 'streaming' },
          { name: 'Listening', value: 'listening' },
          { name: 'Watching', value: 'watching' },
          { name: 'Competing', value: 'competing' },
          { name: 'Custom', value: 'custom' },
        )
    )
    .addStringOption(option =>
      option.setName('text')
        .setDescription('The activity text')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('url')
        .setDescription('URL (only used for Streaming)')
        .setRequired(false)
    ),

  async execute(interaction, client) {
    const developerIds = process.env.DEVELOPER_IDS.split(',').map(id => id.trim());

    if (!developerIds.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ This command is for developers only.', ephemeral: true });
    }

    const status = interaction.options.getString('status');
    const type = interaction.options.getString('type');
    const text = interaction.options.getString('text')?.trim() || '';
    const url = interaction.options.getString('url')?.trim();
    const activityType = activityMap[type];

    const presenceData = {
      status,
      activities: [],
    };

    if (status !== 'invisible' && text) {
      const activity = {
        name: text,
        type: activityType,
      };

      if (activityType === ActivityType.Streaming) {
        if (!url) {
          return interaction.reply({ content: '❌ A valid URL is required for Streaming activity.', ephemeral: true });
        }
        activity.url = url;
      }

      presenceData.activities.push(activity);
    }

    try {
      await client.user.setPresence(presenceData);

      let reply = `✅ Presence updated!\n• Status: **${status}**\n• Type: **${type}**`;
      if (presenceData.activities.length > 0) {
        reply += `\n• Text: **${text}**`;
        if (activityType === ActivityType.Streaming) {
          reply += `\n• URL: **${url}**`;
        }
      } else {
        reply += `\n• Activity: Cleared`;
      }

      await interaction.reply({
        content: reply,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Failed to update presence.', ephemeral: true });
    }
  },
};
