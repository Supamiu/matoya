const { SlashCommandBuilder } = require('@discordjs/builders');
const cards = require('../data/cards.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('card')
        .setDescription('Get a card by name and display it'),
    async execute(interaction) {

    },
};
