const {SlashCommandBuilder} = require('@discordjs/builders');
const cards = require('../data/cards.json');
const {MessageActionRow, MessageSelectMenu, MessageEmbed} = require('discord.js');
const {elements, getI18nProperty} = require('../common');


const imageLangs = {
    'EN': 'eg',
    'FR': 'fr',
    'JA': 'ja',
    'ES': 'es',
    'IT': 'it',
    'DE': 'de',
    'NA': 'eg'
}

function getCardImage(card, lang) {
    if (lang === 'JA') {
        return `http://www.square-enix-shop.com/jp/ff-tcg/card/cimg/large/opus${card.code.split('-')[0]}/${card.code}.png`
    }
    return `https://fftcg.cdn.sewest.net/images/cards/full/${card.code}_${imageLangs[lang]}.jpg`;
}

function parseText(text) {
    return text
        .replace(/\[\[br]]/gmi, '\n')
        .replace(/《S》/gmi, '**S** ')
        .replace(/ダル/gmi, ':arrow_heading_down:')
        .replace(/\[\[s]]([^[]*)\[\[\/]]/gmi, '**$1** ')
        .replace(/\[\[i]]([^[]*)\[\[\/]]/gmi, '__$1__ ')
        .replace(/\[\[ex]]([^[]*)\[\[\/]]/gmi, '***$1*** ')
        .replace(new RegExp(`《([${Object.keys(elements).join('')}]+)》`, 'gmi'), (a, b) => `《(${elements[b]})》 `)
        .replace(/《(\d)》/gmi, '《($1)》 ')
        .replace(/《/gmi, '*')
        .replace(/》/gmi, '* ')
}

function getCardEmbed(card, lang) {
    let embed = new MessageEmbed()
        .setImage(getCardImage(card, lang))
        .setTitle(`${getI18nProperty(card, 'name', lang)} (${card.code})`)
        .setDescription(parseText(getI18nProperty(card, 'text', lang)))
        .addField('Type', getI18nProperty(card, 'type', lang), true)
    if (getI18nProperty(card, 'job', lang)) {
        embed = embed.addField('Job', getI18nProperty(card, 'job', lang), true)
    }

    return embed.addField('Element', card.element.map(el => elements[el]).join('/'), true)
        .addField('Cost', card.cost, true)
        .addField('Categories', [1, 2]
            .filter(i => card[`category_${i}`] !== null)
            .map(i => card[`category_${i}`].split(' ')[0])
            .filter(c => c !== '')
            .join(', '), true)
        .addField('Opus', card.set, true)
        .addField('Code', card.code, true)
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
                ['English', 'en'],
                ['Français', 'fr'],
                ['Español', 'es'],
                ['Italiano', 'it'],
                ['日本', 'ja']
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
                return getI18nProperty(c, 'name', lang).toLowerCase().indexOf(interaction.options.getString('name').toLowerCase()) > -1
                    || getI18nProperty(c, 'name', 'en').toLowerCase().indexOf(interaction.options.getString('name').toLowerCase()) > -1
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
                const options = matchingCards
                    .map(card => {
                        const cardName = `${getI18nProperty(card, 'name', lang)} / ${getI18nProperty(card, 'name', 'en')}`;
                        return {
                            label: card.Code,
                            description: cardName,
                            value: card.Code
                        }
                    })
                    .filter((option, index, array) => array.findIndex(r => r.value === option.value) === index);

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
