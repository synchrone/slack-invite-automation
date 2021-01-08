const request = require('request')
const config = require('../config')

module.exports = {
  verifyRecaptcha: async function (response, remoteip){
    return new Promise((res, rej) => {
      request.post({
        url: 'https://www.google.com/recaptcha/api/siteverify',
        form: {response, secret: config.recaptchaSecretKey, remoteip}
      },
      function(err, httpResponse, body){
        if(err) return rej(err)
        if(httpResponse.statusCode !== 200) return rej(body)
        res(JSON.parse(body).success === true)
      })
    })
  }
}