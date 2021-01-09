const config = require('../config')

module.exports = {
    render: function (res, name, params = {}) {
        res.setLocale(config.locale);
        res.render(name + '.twig', {
            ...params,
            req: res.req.query,
            tokenRequired: !!config.inviteToken,
            recaptchaSiteKey: config.recaptchaSiteKey
        });
    }
}
