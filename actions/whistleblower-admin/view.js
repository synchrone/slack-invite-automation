const i18n = require('i18n')
const config = require("../../config")
const { render } = require('../../lib/render')
const { slack } = require('../../lib/slack')
const { pool } = require('../../lib/pg')
const eol = require('eol');

const { encrypt, decrypt } = require('../../lib/crypto');

module.exports = async function (req, res) {
    const id = req.params.id;

    if (req.method === 'POST') {
        const text = req.body['text']
        const trust = parseInt(req.body['trust'])
        const status = parseInt(req.body['status'])
        const type = parseInt(req.body['type'])

        const hash = encrypt(text);

        try {
            const result = await pool.query('UPDATE insights SET json = $1, trust = $2, status = $3, type = $4, modified_at = NOW() WHERE id = $5', [hash, trust, status, type, id])

            let trustMsg = null;
            if (trust === 1) {
                trustMsg = i18n.__({
                    phrase: 'Trusted Msg',
                    locale: 'ru'
                })
            } else {
                trustMsg = i18n.__({
                    phrase: 'Unverified Msg',
                    locale: 'ru'
                })
            }

            let typeMsg = null;
            if (type === 0) {
                typeMsg = i18n.__({
                    phrase: 'Anonymous question',
                    locale: 'ru'
                })
            } else if (type === 1) {
                typeMsg = i18n.__({
                    phrase: 'Leak. Trust level: *%s*',
                    locale: 'ru'
                }, trustMsg)
            }

            const mrkdwn = eol.split(text).map(chunk => {
                return '>' + chunk;
            }).join("\n");

            if (status === 1) {
                const blocks = [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": mrkdwn,
                        }
                    },
                    {
                        "type": "context",
                        "elements": [
                            {
                                "type": "mrkdwn",
                                "text": typeMsg
                            }
                        ]
                    }
                ]

                if (config.slackInsightsChannel === null) {
                    throw new Error(i18n.__('Slack channel is not defined.'));
                }

                slack.chat.postMessage({
                    channel: config.slackInsightsChannel,
                    blocks: blocks
                });
            }

            return res.redirect('/whistleblower/admin')
        } catch (e) {
            return render(res, 'whistleblower-admin/index', {
                messageText: __('Internal Server Error'),
                isFailedText: true,
            })
        }
    }

    try {
        const result = await pool.query('SELECT * FROM insights WHERE id = $1', [id])

        const data = result.rows[0];

        data.json = decrypt(data.json);

        render(res, 'whistleblower-admin/view', {
            object: data,
        })
    } catch (e) {
        return render(res, 'whistleblower-admin/index', {
            messageText: __('Internal Server Error'),
            isFailedText: true,
        })
    }
}