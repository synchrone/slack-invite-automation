const argon2 = require('argon2');
const crypto = require('crypto');

const config = require('../config');

let twilio, phoneMap, verify = null;
try {
  twilio = require('twilio')(config.twilioAccountSid, config.twilioAuthToken)
  verify = twilio.verify.services(config.twilioVerifyServiceId)
  phoneMap = twilio.sync.services(config.twilioSyncServiceId).syncMaps(config.twilioSyncMapId)
}catch(e){
  if(!config.twilioDebug){ throw e }
}

async function hashPhone(phone){
  const start = +new Date
  const result = await argon2.hash(phone, { type: argon2.argon2id, ...config.hashing})
  console.log('hashing done in ', (+new Date - start))
  const hex = crypto.createHash('sha256').update(result).digest('hex') // make sure hash is alphanumeric, as twilio doesn't like special symbols in keys
  return hex
}

async function phoneIsRegistered(phone){
  if(config.twilioDebug){
    return false
  }
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
  if(config.twilioDebug){
    return
  }
  const hashedPhone = await hashPhone(phone);
  await phoneMap.syncMapItems.create({key: hashedPhone, data: {}})
}

async function sendVerification(phone){
  if(config.twilioDebug){
    return true
  }

  try {
    const carrierInfo = await twilio.lookups.phoneNumbers(phone).fetch({type: 'carrier'})
    if (carrierInfo.carrier.type !== 'mobile') {
      //console.log('carrier for ', phone, ' is not mobile')
      return false
    }

    const smsCheck = await verify.verifications.create({to: phone, channel: 'sms', locale: config.locale})
    // console.log(smsCheck)
    return true
  }catch(e){
    // console.log(e)
    return false
  }
}

async function checkVerification(phone, code){
  if(config.twilioDebug){
    return true
  }

  let check = {status: 'not_found'}
  try {
    check = await verify.verificationChecks.create({to: phone, code})
    // console.log(check)
  }catch(e){
    // console.log(e)
  }
  return check.status === 'approved'
}


module.exports = {
  phoneIsRegistered,
  registerPhone,
  hashPhone,
  phoneMap,
  checkVerification,
  sendVerification
}