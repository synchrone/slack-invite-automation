const config = require('../config')
const {WebClient} = require('@slack/web-api')

const slack = new WebClient(config.slacktoken)

/**
 * OAuth is required for legacy-mode access on admin user's behalf, since users.admin.invite method is not accessible in OAuth2
 */
async function oauthAction(req, res) {
    if (!req.query.code) {
        res.redirect(`https://${config.slackUrl}/oauth?client_id=${config.slackClientId}&scope=client&user_scope=admin&redirect_uri=${config.inviterUrl}/oauth`)
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

/**
 * OAuth2 is used to enable Event subscription apis
 */
async function oauth2Action(req, res) {
    if (!req.query.code) {
        res.redirect(`https://${config.slackUrl}/oauth?client_id=${config.slackClientId}&scope=client&user_scope=channels%3Aread%2Cgroups%3Aread%2Cchannels%3Ahistory&redirect_uri=${config.inviterUrl}/oauth`)
    } else {
        try{
            const response = await slack.oauth.v2.access({
                client_id: config.slackClientId,
                client_secret: config.slackClientSecret,
                code: req.query.code
            })
            res.status(200).send(response)
        }catch(e){
            res.status(500).send(e)
        }
    }
}

module.exports = {
    oauthAction,
    oauth2Action
};