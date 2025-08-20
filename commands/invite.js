const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../utils/emojis.json');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription(`🔔 Invite the bot to your server!`),

    async execute(interaction) {
        const botInvite = process.env.BOT_INVITE || 'https://discord.com/oauth2/authorize?client_id=1367822440742260736&permissions=36702208&integration_type=0&scope=bot+applications.commands';

        const embed = new EmbedBuilder()
        .setTitle(`${emojis.others.notify} Invite Funmi Bot to Your Server!`)
        .setDescription('Click the button to invite Funmi Bot to your server.')
        .setColor('#8505c0');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setLabel('Invite Me!')
            .setStyle(ButtonStyle.Link)
            .setURL(botInvite)
        );
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },
};