const express = require('express');
const request = require('request');
const parse = require('./parse.js');

const app = express();
const port = 3000;

const LEVEL_DIFFICULTY = {
    '0': 'NA',
    '10': 'Easy',
    '20': 'Normal',
    '30': 'Hard',
    '40': 'Harder',
    '50': 'Insane',
    'Auto': 'Auto',
    '3': 'EasyDemon',
    '4': 'MediumDemon',
    '5': 'InsaneDemon',
    '6': 'ExtremeDemon',
    'DefaultDemon': 'HardDemon',
    'FeatureNA': 'FeatureNA',
    'FeatureEasy': 'FeatureEasy',
    'FeatureNormal': 'FeatureNormal',
    'FeatureHard': 'FeatureHard',
    'FeatureHarder': 'FeatureHarder',
    'FeatureInsane': 'FeatureInsane',
    'FeatureAuto': 'FeatureAuto',
    'FeatureEasyDemon': 'FeatureEasyDemon',
    'FeatureMediumDemon': 'FeatureMediumDemon',
    'FeatureInsaneDemon': 'FeatureInsaneDemon',
    'FeatureExtremeDemon': 'FeatureExtremeDemon',
    'FeatureHardDemon': 'FeatureHardDemon',
    'EpicNA': 'EpicNA',
    'EpicEasy': 'EpicEasy',
    'EpicNormal': 'EpicNormal',
    'EpicHard': 'EpicHard',
    'EpicHarder': 'EpicHarder',
    'EpicInsane': 'EpicInsane',
    'EpicAuto': 'EpicAuto',
    'EpicEasyDemon': 'EpicEasyDemon',
    'EpicMediumDemon': 'EpicMediumDemon',
    'EpicInsaneDemon': 'EpicInsaneDemon',
    'EpicExtremeDemon': 'EpicExtremeDemon',
    'EpicHardDemon': 'EpicHardDemon'
};

const DIFFICULTY_COLORS = {
    'NA': 0xa9a9a9,
    'Easy': 0x00e0ff,
    'Normal': 0x00ff3a,
    'Hard': 0xffb438,
    'Harder': 0xfc1f1f,
    'Insane': 0xf91ffc,
    'Auto': 0xf5c96b,
    'EasyDemon': 0xaa6bf5,
    'MediumDemon': 0xac2974,
    'InsaneDemon': 0xb31548,
    'ExtremeDemon': 0x8e0505,
    'HardDemon': 0xff0000
};

const LENGTHS = {
    '0': 'Tiny',
    '1': 'Short',
    '2': 'Medium',
    '3': 'Long',
    '4': 'XL'
};

app.get('/level', (req, res) => {
    const { name, url } = req.query;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Missing or empty level name/ID parameter' });
    }

    const isID = !isNaN(name);
    const apiUrl = isID ? `${url}/downloadGJLevel22.php` : `${url}/getGJLevels21.php`;

    const form = isID
        ? {
            gameVersion: 21,
            levelID: name,
            secret: "Wmdf2893gb7"
        }
        : {
            gameVersion: 21,
            binaryVersion: 35,
            str: name.replace(/ /g, '_'),
            secret: "Wmdf2893gb7"
        };

    request.post(apiUrl, { form }, (err, httpResponse, body) => {
        if (err) {
            return res.status(500).json({ error: 'Error making request', details: err });
        }
        if (body === '-1') {
            return res.status(404).json({ error: `Level '${name}' not found` });
        }

        if (isID) {
            const levelInfo = body.split('#');
            const levelData = parse.parseResponse(levelInfo[0]);
            const level = {
                levelID: levelData[1],
                levelName: levelData[2],
                description: levelData[3],
                version: levelData[5],
                playerID: levelData[6],
                difficulty: levelData[9],
                download: levelData[10],
                officialSong: levelData[12],
                gameVersion: levelData[13],
                likes: levelData[14],
                length: LENGTHS[levelData[15]],
                demon: levelData[17],
                stars: levelData[18],
                featured: levelData[19],
                auto: levelData[25],
                uploadDate: levelData[27],
                updateDate: levelData[29],
                copied: levelData[30],
                twoPlayer: levelData[31],
                customSong: levelData[35],
                coins: levelData[37],
                verifiedCoins: levelData[38],
                timelyID: levelData[41],
                epic: levelData[42],
                demondiff: levelData[43],
                objects: levelData[45],
            };

            let difficulty = LEVEL_DIFFICULTY[level.difficulty] || LEVEL_DIFFICULTY['NA'];
            if (level.auto == 1) {
                difficulty = LEVEL_DIFFICULTY['Auto'];
            } else if (level.demon == 1) {
                difficulty = LEVEL_DIFFICULTY[level.demondiff] || LEVEL_DIFFICULTY['DefaultDemon'];
            }

            if (level.featured > 0) {
                difficulty = `Feature${difficulty}`;
            }

            if (level.epic > 0) {
                difficulty = `Epic${difficulty}`;
            }

            let coinsString = '';
            if (level.verifiedCoins == 1) {
                for (let i = 0; i < level.coins; i++) {
                    coinsString += ':coin:';
                }
            }

            res.json({
                ...level,
                difficulty,
                coins: coinsString,
                colour: DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS['NA']
            });
        } else {
            const data = body.split('#');
            const levelArr = data[0].includes('|') ? data[0].split('|') : [data[0]];
            const creators = data[1].split('|');
            const metaData = data[3].split(':');

            if (metaData[0] == 0) {
                return res.status(404).json({ error: 'No levels could be found' });
            }

            const levels = levelArr.map((lvl, i) => {
                const levelData = parse.parseResponse(lvl);
                return {
                    levelID: levelData[1],
                    levelName: levelData[2],
                    description: levelData[3],
                    version: levelData[5],
                    playerID: levelData[6],
                    difficulty: LEVEL_DIFFICULTY[levelData[9]] || LEVEL_DIFFICULTY['NA'],
                    download: levelData[10],
                    officialSong: levelData[12],
                    gameVersion: levelData[13],
                    likes: levelData[14],
                    length: LENGTHS[levelData[15]],
                    demon: levelData[17],
                    stars: levelData[18],
                    featured: levelData[19],
                    auto: levelData[25],
                    uploadDate: levelData[27],
                    updateDate: levelData[29],
                    copied: levelData[30],
                    twoPlayer: levelData[31],
                    customSong: levelData[35],
                    coins: levelData[37],
                    verifiedCoins: levelData[38],
                    timelyID: levelData[41],
                    epic: levelData[42],
                    demondiff: levelData[43],
                    objects: levelData[45],
                    creator: creators[i].split(':')[1]
                };
            });

            res.json({ levels, totalResults: metaData[0] });
        }
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
