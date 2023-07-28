module.exports = {
    elements: {
        '火': 'Fire',
        '風': 'Wind',
        '氷': 'Ice',
        '土': 'Earth',
        '雷': 'Lightning',
        '水': 'Water',
        '闇': 'Darkness',
        '光': 'Light'
    },
    elementsEmotes: {
        '火': '<:CPFire:910831750387736617>',
        '風': '<:CPWind:910831807484817409>',
        '氷': '<:CPIce:910831791080869908>',
        '土': '<:CPEarth:910831816611614751>',
        '雷': '<:CPLightning:910831824123617290>',
        '水': '<:CPWater:910831831715303434>',
        '闇': '<:CPDark:910831849373319239>',
        '光': '<:CPLight:910831840481398835>'
    },
    getI18nProperty(card, property, lang) {
        return card[`${property.toLowerCase()}_${lang.toLowerCase()}`];
    }
}
