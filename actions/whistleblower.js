const __ = require('i18n').__
const {verifyRecaptcha, verifyRecaptcha2} = require("../lib/recaptcha")
const config = require("../config")
const eol = require('eol');
const { render } = require('../lib/render')
const { pool } = require('../lib/pg')
const { encrypt, decrypt } = require('./../lib/crypto');
const {
    whitespacePipe, separatorPipe, dashPipe,
    commaPipe, bracketsPipe, dotNewlinePipe, excessiveNewlinePipe,
    finalize
} = require('./../lib/text-analyzer');

module.exports = async function (req, res) {
    const ip = req.ip
    const text = req.body['text']

    if (req.method === 'POST') {
        let terms = false;
        try {
            if (Array.isArray(req.body['terms']) && parseInt(req.body['terms'][1])) {
                terms = true;
            }
        } catch (e) {

        }

        let captchaOk = false;
        if (req.query.gc2) { // fallback reCAPTCHA with pazzle
            captchaOk = await verifyRecaptcha2(req.body['g-recaptcha-response'], ip);
        } else {
            captchaOk = await verifyRecaptcha(req.body['g-recaptcha-response'], ip);
        }

        if ((!text || text.length > 99100) || !captchaOk || !terms) {
            let message = null;
            if (!text) {
                message = __('You must enter some text');
            } else if (text.length > 99100) {
                message = __('The text is a way too long');
            }

            if (!captchaOk) {
                message = __('reCAPTCHA check has failed')
            }

            return render(res, 'whistleblower', {
                text: text,
                messageText: message,
                isFailedText: !captchaOk || !text,
                isFailedTerms: !terms,
                captchaV2: !captchaOk,
            })
        }

        let ptr = 0
        let stack = []
        req.body['text'].replace(/([\n.!?]+)|([?!])/g, function(match, contents, offset, input_string) {
            stack.push({
                'separator': contents,
                'text': req.body['text'].slice(ptr, input_string).trim(),
            });

            ptr = input_string + contents.length
        })

        const pipe = [
            separatorPipe,
            whitespacePipe,
            dotNewlinePipe,
            bracketsPipe,
            commaPipe,
            dashPipe,
            excessiveNewlinePipe
        ]

        for (let i = 0; i < pipe.length; i++) {
            const func = pipe[i]

            stack = func(stack)
        }


        const body = finalize(stack)
        const hash = encrypt(body);

        try {
            await pool.query('INSERT INTO insights (json, type, trust, status) VALUES ($1, $2, $3, $4)', [hash, null, 0, 0])

            render(res, 'whistleblower', {
                isSuccess: true,
            })

            return;
        } catch (e) {
            return render(res, 'whistleblower', {
                text: text,
                messageText: __('Internal Server Error'),
                isFailedText: true,
            })
        }
    }

    render(res, 'whistleblower')
}