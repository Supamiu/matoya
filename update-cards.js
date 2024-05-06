const fs = require('fs');
const path = require('path');

import('node-fetch').then(({default: fetch}) => {

    fetch("https://fftcg.square-enix-games.com/en/get-cards", {
        "body": "{\"language\":\"fr\",\"text\":\"\",\"type\":[\"backup\"],\"element\":[\"fire\",\"ice\",\"wind\",\"earth\",\"lightning\",\"water\",\"light\",\"darkness\"],\"cost\":[],\"rarity\":[],\"power\":[],\"category_1\":[],\"set\":[],\"multicard\":\"\",\"ex_burst\":\"\",\"code\":\"\",\"special\":\"\",\"exactmatch\":0}",
        "method": "POST",
        "mode": "cors"
    })
        .then(res => res.json())
        .then(fullIndex => {
            fs.writeFileSync(path.join(__dirname, './src/data/cards.json'), JSON.stringify(fullIndex.cards));
        });

});

