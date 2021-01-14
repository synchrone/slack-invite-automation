const axios = require('axios')
const qs = require('querystring')
const config = require('../config')

function form(data){
    return qs.encode(data)
}

async function verifyRecaptcha(response, remoteip, key){
    const data = (
      await axios.post('https://www.google.com/recaptcha/api/siteverify',
        form({response, secret: key || config.recaptchaSecretKey, remoteip}))
    ).data
    let isOk = data.success && (data.score === undefined || parseFloat(data.score) > parseFloat(config.recaptchaThreshold));
    if (!isOk) {
        console.log(data)
    }
    return isOk
}

module.exports = {
    verifyRecaptcha,
    verifyRecaptcha2: (response, remoteip) => verifyRecaptcha(response, remoteip, config.recaptchaSecretKeyV2)
}
