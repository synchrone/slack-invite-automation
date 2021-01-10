const config = require('../config')
const {slack} = require('@slack/web-api')

/**
 * OAuth is required for legacy-mode access on admin user's behalf, since users.admin.invite method is not accessible in OAuth2
 */
async function oauth(req, res) {
    if (!req.query.code) {
        res.redirect(`https://${config.slackUrl}/oauth?client_id=${config.slackClientId}&scope=client&user_scope=admin&redirect_uri=${config.inviterUrl}/oauth`)
    } else {
        const response = await slack.oauth.access({
            code: req.query.code,
            client_id: config.slackClientId,
            client_secret: config.slackClientSecret
        })
        res.status(200).send(response)
    }
}

/**
 * OAuth2 is used to enable Event subscription apis
 */
async function oauth2(req, res) {
    if (!req.query.code) {
        res.redirect(`https://${config.slackUrl}/oauth/v2/authorize?client_id=${config.slackClientId}&scope=channels:history`)
    } else {
        const response = await slack.oauth.v2.access({
            client_id: config.slackClientId,
            client_secret: config.slackClientSecret
        })
    }
}

module.exports = {
    oauth,
    oauth2
};