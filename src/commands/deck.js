const {SlashCommandBuilder} = require('@discordjs/builders');
const cards = require('../data/cards.json');
const {MessageActionRow, MessageSelectMenu, MessageEmbed} = require('discord.js');
const axios = require("axios");
const {elements, elementsEmotes, getI18nProperty} = require('../common');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('deck')
        .setDescription('Display a deck from ffdecks')
        .addStringOption(option => option.setName('link').setDescription('ffdecks link to the deck').setRequired(true))
        .addStringOption(option => option.setName('language')
            .setDescription('Language to use for the card names')
            .addChoices([
                ['English', 'en'],
                ['Français', 'fr'],
                ['Español', 'es'],
                ['Italiano', 'it'],
                ['日本', 'ja']
            ])
        ),
    async execute(interaction) {
        const lang = interaction.options.getString('language') || 'en';
        const deckId = interaction.options.getString('link').split('/').pop();
        const deck = await axios.get(`https://ffdecks.com/api/deck?deck_id=${deckId}`).then(res => res.data);
        const cardsData = deck.cards.map(card => {
            const FFTCGcard = cards.find(c => c.code.startsWith(card.card.serial_number));
            const elementsDisplay = FFTCGcard.element.map(el => elementsEmotes[el]).join('/');
            return {
                display: ` • ${elementsDisplay} [${FFTCGcard.code}] **${getI18nProperty(FFTCGcard, 'name', lang)}** x${card.quantity}`,
                quantity: card.quantity,
                type: FFTCGcard.type_en,
                elements: FFTCGcard.element,
                cost: FFTCGcard.cost
            };
        });

        const stats = cardsData.reduce((acc, row) => {
            acc.types[row.type] = (acc.types[row.type] || 0) + row.quantity;
            acc.costs[row.cost] = (acc.costs[row.cost] || 0) + row.quantity;
            row.elements.forEach(el => {
                acc.elements[el] = (acc.elements[el] || 0) + row.quantity;
            });
            return acc;
        }, {
            types: {},
            elements: {},
            costs: {}
        });
        await interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle(`${deck.name} (${deck.archetype})`)
                    .setURL(interaction.options.getString('link'))
                    .setDescription(cardsData.map(data => data.display).join('\n'))
                    .addField('Forwards', (stats.types.Forward || 0).toString(), true)
                    .addField('Summons', (stats.types.Summon || 0).toString(), true)
                    .addField('Backups', (stats.types.Backup || 0).toString(), true)
                    .addField('Monsters', (stats.types.Monster || 0).toString(), true)
                    .addField('Elements', Object.keys(stats.elements).map(key => {
                        return ` • ${elementsEmotes[key]} ${elements[key]}: ${stats.elements[key]}`;
                    }).join('\n'), true)
                    .addField('Costs', `
                    **Average**: ${(cardsData.map(c => c.cost * c.quantity).reduce((acc, v) => acc + v, 0) / 50).toPrecision(2)}
                    
                    ${Object.keys(stats.costs).map(key => {
                        return ` • **${key}**: ${stats.costs[key]}`;
                    }).join('\n')}`, true)
                    .setFooter(`By ${deck.creator}`)
            ]
        });
    },
};
