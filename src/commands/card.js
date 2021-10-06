const {SlashCommandBuilder} = require('@discordjs/builders');
const cards = require('../data/cards.json');
const {MessageActionRow, MessageSelectMenu, MessageEmbed} = require('discord.js');

const elements = {
    '火': 'Fire',
    '風': 'Wind',
    '氷': 'Ice',
    '土': 'Earth',
    '雷': 'Thunder',
    '水': 'Water',
    '闇': 'Darkness',
    '光': 'Light'
}

function parseText(text) {
    return text
        .replace(/\[\[br]]/gmi, '\n')
        .replace(/《S》/gmi, '**S** ')
        .replace(/\[\[s]]([^[]*)\[\[\/]]/gmi, '**$1** ')
        .replace(/\[\[i]]([^[]*)\[\[\/]]/gmi, '__$1__ ')
        .replace(/\[\[ex]]([^[]*)\[\[\/]]/gmi, '***$1*** ')
        .replace(new RegExp(`《([${Object.keys(elements).join('')}]+)》`, 'gmi'), (a, b) => `《(${elements[b]})》 `)
        .replace(/《(\d)》/gmi, '《($1)》 ')
        .replace(/[《》]/gmi, '*')
}

function getCardEmbed(card, lang) {
    let embed = new MessageEmbed()
        .setImage(`https://fftcg.cdn.sewest.net/images/cards/full/${card.Code}_${lang.toLowerCase()}.jpg`)
        .setTitle(`${getI18nProperty(card, 'Name', lang)} (${card.Code})`)
        .setDescription(parseText(getI18nProperty(card, 'Text', lang)))
        .addField('Type', getI18nProperty(card, 'Type', lang), true)
    if (getI18nProperty(card, 'Job', lang)) {
        embed = embed.addField('Job', getI18nProperty(card, 'Job', lang), true)
    }

    return embed.addField('Element', card.Element.split('/').map(el => elements[el]).join('/'), true)
        .addField('Cost', card.Cost, true)
        .addField('Categories', [1, 2].map(i => card[`Category_${i}`].split(' ')[0]).filter(c => c !== '').join(', '), true)
        .addField('Opus', card.Set, true)
        .addField('Code', card.Code, true)
}

function getI18nProperty(card, property, lang) {
    if (lang === 'JA') {
        return card[property];
    }
    return card[`${property}_${lang}`];
}

const inputsCache = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('card')
        .setDescription('Get a card by name and display it')
        .addStringOption(option => option.setName('name').setDescription('Name of the card or part of it').setRequired(true))
        .addStringOption(option => option.setName('language')
            .setDescription('Language to use for the card\'s name')
            .setRequired(true)
            .addChoices([
                ['English', 'EN'],
                ['Français', 'FR'],
                ['Español', 'ES'],
                ['Italiano', 'IT'],
                ['日本', 'JA']
            ])
        ),
    async execute(interaction) {
        if (interaction.isSelectMenu()) {
            const card = cards.find(c => c.Code === interaction.values[0]);
            const lang = inputsCache[interaction.message.interaction.id];
            await interaction.reply({
                embeds: [getCardEmbed(card, lang)]
            });
            setTimeout(() => {
                delete inputsCache[interaction.message.interaction.id];
            }, 30000);
        } else {
            const lang = interaction.options.getString('language');
            const matchingCards = cards.filter(c => {
                return getI18nProperty(c, 'Name', lang).toLowerCase().indexOf(interaction.options.getString('name').toLowerCase()) > -1
                    || getI18nProperty(c, 'Name', 'EN').toLowerCase().indexOf(interaction.options.getString('name').toLowerCase()) > -1
            });

            if (matchingCards.length === 0) {
                interaction.reply({
                    content: "No cards found"
                })
            } else if (matchingCards.length === 1) {
                await interaction.reply({
                    embeds: [getCardEmbed(matchingCards[0], lang)]
                });
            } else {
                const options = matchingCards.map(card => {
                    const cardName = `${getI18nProperty(card, 'Name', lang)} / ${getI18nProperty(card, 'Name', 'EN')}`;
                    return {
                        label: card.Code,
                        description: cardName,
                        value: card.Code
                    }
                });

                const selector = new MessageActionRow()
                    .addComponents(
                        new MessageSelectMenu()
                            .setCustomId('card:select')
                            .setPlaceholder('Please select a card')
                            .addOptions(options),
                    );
                await interaction.reply({
                    content: 'Please select the card you want to see',
                    components: [selector],
                    ephemeral: true
                });
                inputsCache[interaction.id] = lang;
            }
        }
    },
};
