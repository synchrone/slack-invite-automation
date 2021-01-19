const __ = require('i18n').__
const {ipIsSafe, sendVerification, phoneIsRegistered} = require('../lib/verification')
const {verifyRecaptcha, verifyRecaptcha2} = require("../lib/recaptcha")
const { render } = require('../lib/render')

module.exports = async function (req, res) {
    const ip = req.ip
    const isLocal = req.socket.localAddress === ip
    const safeIp = isLocal || await ipIsSafe(ip)

    let captchaOk = false;
    if (req.query.gc2) { // fallback reCAPTCHA with pazzle
        captchaOk = await verifyRecaptcha2(req.body['g-recaptcha-response'], ip);
    } else {
        captchaOk = await verifyRecaptcha(req.body['g-recaptcha-response'], ip);
    }

    if (!safeIp || !captchaOk) {
        console.log('security check failed', {safeIp, captchaOk})
        return render(res, 'index', {
            message: __('reCAPTCHA check has failed'),
            isFailed: true,
            captchaV2: !captchaOk,
        })
    }

    if (req.body.phone === undefined || !req.body.phone) {
        return render(res, 'index', {
            message: 'The phone number should not be empty',
            isFailed: true,
            captchaV2: (req.query.gc2 !== undefined && req.query.gc2)
        })
    }

    if (!/^\+49\s*[(]?\d{2,}[)]?[-\s\.]?\d{2,}?[-\s\.]?\d{2,}[-\s\.]?\d{0,9}$/im.test(req.body.phone)) {
        return render(res, 'index', {
            message: __('The entered phone number has invalid format. Please use +49XXXXXXXXXXX'),
            isFailed: true,
            captchaV2: (req.query.gc2 !== undefined && req.query.gc2)
        })
    }

    const phone = req.body.phone.replace(/[^0-9+]/g, '')

    const isRegistered = await phoneIsRegistered(phone)
    const smsSent = await sendVerification(phone, {ratelimit: ip});
    if (!isRegistered && smsSent) {
        render(res, 'index', { phone })
    } else {
        console.log('verification failed', {isRegistered, smsSent})
        render(res, 'index', {
            message: __('Cannot send SMS verification to %s',  phone),
            isFailed: true,
            captchaV2: (req.query.gc2 !== undefined && req.query.gc2)
        })
    }
}