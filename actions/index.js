const { render } = require('../lib/render');

module.exports = function (req, res) {
    let usp = [
        { channel: '#jobs', description: 'Top paid jobs in Berlin, Munich, Hamburg and other cities in Germany.' },
        { channel: '#auto', description: 'Howtos for Driver\'s license, carsharing tips and car maintenance.' },
        { channel: '#dev', description: 'Leet code discussions, test tasks help, frameworks and language experience exchange.' },
        { channel: '#diy', description: 'Hobby projects, 3d-printing, renovations, repairs and car/bike maintenance.' },
    ];
    let channels = [];

    for (let i = 0; i < 4; i++) {
        const idx = Math.floor(Math.random() * usp.length);

        channels.push(usp[idx]);
        usp.splice(idx, 1);
    }

    render(res, 'index', {
        isIndex: true,
        channels: channels,
    });
};
