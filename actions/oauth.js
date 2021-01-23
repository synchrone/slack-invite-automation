const config = require('../config')
const {WebClient} = require('@slack/web-api')
const slack = new WebClient()

/**
 * OAuth is required for legacy-mode access on admin user's behalf, since users.admin.invite method is not accessible in OAuth2
 */
function oauthActionFactory(path, extra) {
    return async function oauthHandler(req, res) {
    if (!req.query.code) {
            res.redirect(`https://${config.slackUrl}/oauth?client_id=${config.slackClientId}&redirect_uri=${config.inviterUrl}/${path}&${extra}`)
    } else {
        try {
            const response = await slack.oauth.access({
                code: req.query.code,
                client_id: config.slackClientId,
                client_secret: config.slackClientSecret
            })
            res.status(200).send(response)
        }catch(e){
            console.log(e)
            res.status(500).send(e.toString())
        }

        }
    }
}

module.exports = {
    oauthAction: oauthActionFactory('oauth', 'scope=client&user_scope=admin'),
    oauthBotAction: oauthActionFactory('oauthBot', 'scope=admin%2Cbot%2Cchannels%3Aread%2Cgroups%3Aread%2Cchannels%3Ahistory')
}