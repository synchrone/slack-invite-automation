const {ipIsSafe, sendVerification, phoneIsRegistered} = require('../lib/verification')
const {verifyRecaptcha} = require("../lib/recaptcha")

const { render } = require('../lib/render')

module.exports = async function (req, res) {
    const ip = req.ip
    const isLocal = req.socket.localAddress === ip
    const safeIp = isLocal || await ipIsSafe(ip)

    if (!safeIp || !await verifyRecaptcha(req.body['g-recaptcha-response'], ip)) {
        return render(res, 'index', {
            message: 'reCAPTCHA check has failed',
            isFailed: true
        })
    }

    if (req.body.phone === undefined || !req.body.phone) {
        return render(res, 'index', {
            message: 'The phone number should not be empty',
            isFailed: true
        })
    }

    if (!/^\+49\s*[(]?\d{2,}[)]?[-\s\.]?\d{2,}?[-\s\.]?\d{2,}[-\s\.]?\d{0,9}$/im.test(req.body.phone)) {
        return render(res, 'index', {
            message: 'The entered phone number has invalid format. Please use +49XXXXXXXXXXX',
            isFailed: true
        })
    }

    const phone = req.body.phone.replace(/[^0-9+]/g, '')

    const isRegistered = await phoneIsRegistered(phone)
    if (!isRegistered && await sendVerification(phone, {ratelimit: ip})) {
        render(res, 'index', { phone })
    } else {
        render(res, 'index', {
            message: 'Cannot send SMS verification to ' + phone,
            isFailed: true
        })
    }
}