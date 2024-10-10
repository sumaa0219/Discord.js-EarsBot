import { REST, Routes } from 'discord.js';
import dotenv from "dotenv";
import fs from "fs";
import path from 'path';
import { pathToFileURL } from 'url';

dotenv.config();

const commands = [];
// commandsフォルダから、.jsで終わるファイルのみを取得
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
(async () => {
    for (const file of commandFiles) {
        const filePath = `./commands/${file}`;
        const fileUrl = pathToFileURL(filePath).href;
        // 動的インポートを使用
        const commandModule = await import(fileUrl);
        const command = commandModule.default;
        if (command && command.data && typeof command.data.toJSON === 'function') {
            commands.push(command.data.toJSON());
        } else {
            console.error(`Error loading command ${filePath}: Invalid command structure`);
        }
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    // and deploy your commands!
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();