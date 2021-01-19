const config = require('../config')

module.exports = {
    render: function (res, name, params = {}) {
        res.setLocale(config.locale);
        res.render(name + '.twig', {
            ...params,
            req: res.req.query,
            cityIdx: Math.floor(Math.random() * 4),
            tokenRequired: !!config.inviteToken,
            recaptchaSiteKey: config.recaptchaSiteKey
        });
    }
}
