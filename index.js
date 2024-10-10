import fs from "fs";
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from "dotenv";
import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
client.commands = new Collection();

// __dirnameの代わりにimport.meta.urlを使用
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// commandsフォルダから、.jsで終わるファイルのみを取得
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    // file://スキームに変換
    const fileUrl = pathToFileURL(filePath).href;
    // 動的インポートを使用
    import(fileUrl).then(commandModule => {
        const command = commandModule.default;
        // 取得した.jsファイル内の情報から、コマンドと名前をListenner-botに対して設定
        if (command && 'data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING]  ${filePath} のコマンドには、必要な "data" または "execute" プロパティがありません。`);
        }
    }).catch(err => {
        console.error(`Error loading command ${filePath}:`, err);
    });
}

// コマンドが送られてきた際の処理
client.on(Events.InteractionCreate, async interaction => {
    // コマンドでなかった場合は処理せずさよなら。
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    // 一致するコマンドがなかった場合
    if (!command) {
        console.error(` ${interaction.commandName} というコマンドは存在しません。`);
        return;
    }

    try {
        // コマンドを実行
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'コマンドを実行中にエラーが発生しました。', ephemeral: true });
    }
});

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    //もし/recフォルダがなければ作成
    if (!fs.existsSync('./rec')) {
        fs.mkdirSync('./rec');
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);