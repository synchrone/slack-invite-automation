const argon2 = require('argon2');
const crypto = require('crypto');

const config = require('../config');

const twilio = require('twilio')(config.twilioAccountSid, config.twilioAuthToken)
const verify = twilio.verify.services(config.twilioVerifyServiceId)
const phoneMap = twilio.sync.services(config.twilioSyncServiceId).syncMaps(config.twilioSyncMapId)

async function hashPhone(phone){
  const start = +new Date
  const result = await argon2.hash(phone, { type: argon2.argon2id, ...config.hashing})
  console.log('hashing done in ', (+new Date - start))
  const hex = crypto.createHash('sha256').update(result).digest('hex') // make sure hash is alphanumeric, as twilio doesn't like special symbols in keys
  return hex
}

async function phoneIsRegistered(phone){
  try {
    const hashedPhone = await hashPhone(phone);
    await phoneMap.syncMapItems(hashedPhone).fetch()
  } catch(e) {
    if (e.status !== 404) { throw e }
    return false
  }
  return true
}

async function registerPhone(phone){
  const hashedPhone = await hashPhone(phone);
  await phoneMap.syncMapItems.create({key: hashedPhone, data: {}})
}


module.exports = {
  phoneIsRegistered,
  registerPhone,
  hashPhone,
  phoneMap,
  twilio,
  verify
}