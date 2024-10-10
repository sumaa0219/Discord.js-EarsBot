import { SlashCommandBuilder } from '@discordjs/builders';
import { joinVoiceChannel, EndBehaviorType, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } from '@discordjs/voice';
import fs from 'fs';
import { recognize_from_file } from '../speech.js'; // speech.jsから関数をインポート
import dotenv from "dotenv";
import prism from 'prism-media';

dotenv.config();

export default {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('VCに参加して議事録を取ります。'),

    async execute(interaction) {
        if (!interaction.member.voice.channel) {
            await interaction.reply("ボイスチャンネルに入ってからコマンドを実行してください");
            return;
        }
        // BOTがVCに参加しているか確認
        if (interaction.guild.members.cache.get(interaction.client.user.id).voice.channel) {
            await interaction.reply("既にボイスチャンネルに参加しています。");
            return;
        }
        await interaction.reply("ボイスチャンネルに参加しました。議事録を取ります。");
        const textChannel = interaction.channelId;
        // VCに参加する処理
        const connection = joinVoiceChannel({
            guildId: interaction.guildId,
            channelId: interaction.member.voice.channelId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        var displayName = "";


        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('The bot has connected to the channel!');

        });

        const receiver = connection.receiver;

        receiver.speaking.on('start', async (userId) => {
            console.log(`Listening to ${userId}`);
            const audioStream = receiver.subscribe(userId, {
                mode: 'pcm',
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 1000,
                },
            });
            try {
                const member = await interaction.guild.members.fetch(userId);
                displayName = member.nickname || member.user.globalName;
                console.log(`speaking user name: ${displayName}`);
            } catch (error) {
                console.error(`Failed to fetch user: ${error}`);
            }

            const outputPath = `./rec/${userId}-${Date.now()}.pcm`;
            const outputStream = fs.createWriteStream(outputPath);

            const opusDecoder = new prism.opus.Decoder({
                frameSize: 960,
                channels: 2,
                rate: 48000,
            });

            audioStream.pipe(opusDecoder).pipe(outputStream);
            audioStream.on("end", async () => {
                try {
                    console.log(`Finished recording ${userId}`);
                    const [response] = await recognize_from_file(outputPath);
                    if (response.results) {
                        for (let result of response.results) {
                            if (
                                result &&
                                result.alternatives &&
                                interaction.member &&
                                interaction.member.voice.channel
                            ) {
                                interaction.client.channels.cache.get(textChannel).send(`${displayName}: \n> ${result.alternatives[0].transcript}`);
                            }
                        }
                    }

                }
                catch (err) {
                    console.log(err);
                } finally {
                    fs.unlinkSync(outputPath);
                }
            });


        });
    }
}