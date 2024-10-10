import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';

export default {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('VCから退出します。'),
    async execute(interaction) {
        const botMember = interaction.guild.members.cache.get(interaction.client.user.id);

        // VCに参加していない場合
        if (!botMember.voice.channel) {
            await interaction.reply("ボイスチャンネルに参加していません。");
            return;
        }

        // VCから退出する
        const connection = getVoiceConnection(interaction.guild.id);
        if (connection) {
            connection.destroy();
            await interaction.reply("ボイスチャンネルから退出しました。議事録を終了します。");
        } else {
            await interaction.reply("ボイスチャンネルから退出できませんでした。");
        }
    },
};