const { SlashCommandBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(` Get a list of available commands`),

    async execute(interaction, client) {
        try {
            const commands = client.commands;
            const categories = {};

            commands.forEach(command => {
                let category = 'Other';
                const desc = command.data.description.toLowerCase();
                const name = command.data.name.toLowerCase();

                if (desc.includes('music') || desc.includes('song') || desc.includes('play') || 
                    name.includes('play') || name.includes('stop') || name.includes('skip') || 
                    name.includes('pause') || name.includes('volume')) {
                    category = 'Music';
                } else if (desc.includes('utility') || name === 'help' || name === 'ping' || 
                         name === 'invite'|| name === 'presence') {
                    category = 'Utility';
                }

                if (!categories[category]) {
                    categories[category] = [];
                }

                categories[category].push({
                    name: command.data.name,
                    description: command.data.description
                });
            });

            const helpEmbed = new EmbedBuilder()
                .setColor('#ffae00')
                .setTitle(`${emojis.others.commands} Funmi Bot Commands`)
                .setDescription('Here are all available commands:')
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTimestamp();

            Object.entries(categories).forEach(([categoryName, commandList]) => {
                if (commandList.length > 0) {
                    commandList.sort((a, b) => a.name.localeCompare(b.name));
                    
                    const commandText = commandList
                        .map(cmd => `${getCommandEmoji(cmd.name)} \`/${cmd.name}\` - ${cmd.description}`)
                        .join('\n');

                    helpEmbed.addFields({
                        name: `${getCategoryEmoji(categoryName)} ${categoryName}`,
                        value: commandText,
                        inline: false
                    });
                }
            });

            helpEmbed.addFields({
                name: `${emojis.others.info} How to use?`,
                value: 'Use `/` followed by the command name to use a command.\nExample: `/play song name`',
                inline: false
            });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Support Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.gg/qsqEekAyNn')
                );

            await interaction.reply({ 
                embeds: [helpEmbed],
                components: [row]
            });

        } catch (error) {
            console.error('Error in help command:', error);
            await interaction.reply({ 
                content: `${emojis.music.error} An error occurred while fetching the commands.`,
                ephemeral: true 
            });
        }
    }
};

function getCommandEmoji(commandName) {
    switch (commandName) {
        case 'play':
            return emojis.music.play;
        case 'pause':
            return emojis.music.pause;
        case 'stop':
            return emojis.music.stop;
        case 'skip':
        case 'next':
            return emojis.music.next;
        case 'previous':
            return emojis.music.previous;
        case 'help':
            return emojis.others.commands;
        case 'invite':
            return emojis.others.notify;
        case 'presence':
            return emojis.others.settings;
        default:
            return emojis.others.info;
    }
}

function getCategoryEmoji(category) {
    switch (category) {
        case 'Music':
            return emojis.music.queue;
        case 'Utility':
            return emojis.others.settings;
        default:
            return emojis.others.info;
    }
}