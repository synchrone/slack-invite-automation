const config = require('../config');
const request = require('request');

module.exports = function (req, res) {
    //this endpoint helps getting the slacktoken for config
    if (!req.query.code) {
        res.redirect(`https://${config.slackUrl}/oauth?client_id=${config.slackClientId}&scope=client&user_scope=admin&redirect_uri=${config.inviterUrl}/oauth`)
    } else {
        request.post({
            url: 'https://' + config.slackUrl + '/api/oauth.access',
            form: {
                code: req.query.code,
                client_id: config.slackClientId,
                client_secret: config.slackClientSecret
            }
        }, (err, httpResp, body) => {
            res.status(httpResp.statusCode).send(body)
        })
    }
};