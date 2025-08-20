const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const emojis = require('../utils/emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription(`⏹️ Stop the current music playback`),

    async execute(interaction, client) {

        const voiceChannel = interaction.member.voice.channel;
        const queue = client.distube.getQueue(interaction.guildId);

        if (!voiceChannel) {
            return interaction.reply({
                content: `${emojis.music.errro} You need to be in a voice channel to stop the music!`,
                ephemeral: true,
            });
        }

        if (!queue) {
            return interaction.reply({
                content: `${emojis.music.error} There is no music currently playing!`,
                ephemeral: true,
            });
        }

        const botVoiceChannel = queue.voice.channel;
        if (voiceChannel.id !== botVoiceChannel.id) {
            return interaction.reply({
                content: `${emojis.music.error} You need to be in the same voice channel as the bot to stop the music!`,
                ephemeral: true,
            });
        }

        try {
            const currentSong = queue.songs[0];
            const queueLength = queue.songs.length;

            await client.distube.stop(interaction.guildId);

            const voice = client.distube.voices.get(interaction.guildId);
            if (voice && voice.connection) {
                voice.connection.destroy();
            }

            const stopEmbed = new EmbedBuilder()
            .setColor('#ffae00')
            .setTitle(`${emojis.music.stop} Music Stopped`)
            .setDescription(`**Stopped playing:** [${currentSong.name}](${currentSong.url})`)
            .addFields(
                { name: 'Last playing', value: currentSong ? `**${currentSong.name}**` : 'None', inline: true },
                { name: 'Songs Cleared', value: `${queueLength}`, inline: true },
                { name: `${emojis.music.user} Stopped by`, value: interaction.user.toString(), inline: true} 
            )
            .setFooter({
                text: `Stopped by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

            await interaction.reply({ embeds: [stopEmbed] });
        } catch (err) {
            console.error('error stopping music:', err);

            const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle(`${emojis.music.error} Error`)
            .setDescription('An error occurred while trying to stop the music playback.')
            .addFields({
                name: `${emojis.sources.search} Error Details`,
                value: `\`\`\`${err.message || 'Unknown Error'}\`\`\``,
            })
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed]});
        }
    }
}