const fs = require("fs");
const path = require("path");
const {exec} = require("child_process");

const {SlashCommandBuilder} = require('@discordjs/builders');
const cards = require('../data/cards.json');
const {MessageEmbed} = require('discord.js');

// Just to avoid too many updates
let lastUpdate = 0;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update Matoya\'s cards registry'),
    async execute(interaction) {
        // One update every 10min max
        if (Date.now() - lastUpdate < 600000) {
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Card Update isn't available`)
                        .setDescription(`Another update has been done <t:${lastUpdate}:R>, you'll be able to run another one <t:${lastUpdate + 600000}:R>.`)
                ]
            });
            return;
        }


        await interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle('Cards update started')
                    .setDescription(`Fetching latest cards from Square Enix API...`)
            ]
        });

        const fetch = await import('node-fetch').then(i => i.default);

        const fullIndex = await fetch("https://fftcg.square-enix-games.com/fr/get-cards", {
            "body": "{\"language\":\"fr\",\"text\":\"\",\"type\":[],\"element\":[],\"cost\":[],\"rarity\":[],\"power\":[],\"category_1\":[],\"set\":[],\"multicard\":\"\",\"ex_burst\":\"\",\"code\":\"\",\"special\":\"\",\"exactmatch\":0}",
            "method": "POST",
            "mode": "cors"
        }).then(res => res.json());

        fs.writeFileSync(path.join(__dirname, './src/data/cards.json'), JSON.stringify(fullIndex.cards));

        await interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setTitle('Cards update done !')
                    .setDescription(`Added ${fullIndex.cards.length - cards.length} cards. Restarting to apply changes, this should take a minute...`)
            ]
        });

        exec('pm2 restart Matoya');
    },
};
