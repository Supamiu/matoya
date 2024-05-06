const fs = require("fs");
const path = require("path");
const {exec} = require("child_process");

const {SlashCommandBuilder} = require('@discordjs/builders');
const cards = require('../data/cards.json');
const {MessageEmbed} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update Matoya\'s cards registry'),
    async execute(interaction) {

        await interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle('Cards update started')
                    .setColor('AQUA')
                    .setDescription(`Fetching latest cards from Square Enix API...`)
            ]
        });

        const fetch = await import('node-fetch').then(i => i.default);

        const fullIndex = await fetch("https://fftcg.square-enix-games.com/en/get-cards", {
            "body": "{\"language\":\"en\",\"text\":\"\",\"type\":[],\"element\":[],\"cost\":[],\"rarity\":[],\"power\":[],\"category_1\":[],\"set\":[],\"multicard\":\"\",\"ex_burst\":\"\",\"code\":\"\",\"special\":\"\",\"exactmatch\":0}",
            "method": "POST",
            "mode": "cors"
        }).then(res => res.json());
        const addedCards = fullIndex.cards.length - cards.length;

        if(addedCards > 0){

            fs.writeFileSync(path.join(__dirname, '../data/cards.json'), JSON.stringify(fullIndex.cards));

            await interaction.editReply({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Cards update done !')
                        .setColor('GREEN')
                        .setDescription(`Added ${addedCards} cards. Restarting to apply changes, this should take a few seconds...`)
                ]
            });
            setTimeout(() => {
                exec('pm2 restart Matoya');
            }, 1000);
        } else {
            await interaction.editReply({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Cards update done !')
                        .setColor('GOLD')
                        .setDescription(`No new cards found, nothing changed.`)
                ]
            });
        }
    },
};
