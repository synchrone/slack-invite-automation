const argon2 = require('argon2');
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

let twilio, phoneMap, verify, sync = null;
try {
    twilio = require('twilio')(config.twilioAccountSid, config.twilioAuthToken)
    verify = twilio.verify.services(config.twilioVerifyServiceId)
    sync = twilio.sync.services(config.twilioSyncServiceId);
    phoneMap = sync.syncMaps(config.twilioSyncMapId)
} catch (e) {
    if (!config.twilioDebug) {
        throw e
    }
}

async function hashPhone(phone) {
    const start = +new Date
    const result = await argon2.hash(phone, {type: argon2.argon2id, ...config.hashing})
    console.log('hashing done in ', (+new Date - start))
    const hex = crypto.createHash('sha256').update(result).digest('hex') // make sure hash is alphanumeric, as twilio doesn't like special symbols in keys
    return hex;
}

async function phoneIsRegistered(phone) {
    if (config.twilioDebug) {
        return false;
    }
    try {
        const hashedPhone = await hashPhone(phone);
        await phoneMap.syncMapItems(hashedPhone).fetch()
    } catch (e) {
        if (e.status !== 404) {
            if (config.env === 'dev') {
                throw e;
            } else {
                return false;
            }
        }

        return false;
    }

    return true
}

async function registerPhone(phone) {
    if (config.twilioDebug) {
        return;
    }
    const hashedPhone = await hashPhone(phone);
    await phoneMap.syncMapItems.create({key: hashedPhone, data: {}})
}

async function sendVerification(phone, ratelimitKey) {
    if (config.twilioDebug) {
        return true
    }

    try {
        const carrierInfo = await twilio.lookups.phoneNumbers(phone).fetch({type: 'carrier'})
        console.log({carrier: carrierInfo.carrier, cc: carrierInfo.country_code})
        if (carrierInfo.carrier.type !== 'mobile' || config.allowedCountries.indexOf(carrierInfo.country_code) === -1) {
            //console.log('carrier for ', phone, ' is not mobile')
            return false
        }

        const smsCheck = await verify.verifications.create({to: phone, channel: 'sms', locale: config.locale, rateLimits: ratelimitKey})
        // console.log(smsCheck)
        return true
    } catch (e) {
        // console.log(e)
        return false
    }
}

async function checkVerification(phone, code) {
    if (config.twilioDebug) {
        return true
    }

    let check = {status: 'not_found'}
    try {
        check = await verify.verificationChecks.create({to: phone, code})
        // console.log(check)
    } catch (e) {
        // console.log(e)
    }
    return check.status === 'approved'
}

async function ipIsSafe(address){
    if(!config.ipLookup){
        return true
    }

    const url = config.ipLookup.replace('%s', address)
    try{
        const info = (await axios.get(url)).data
        return info.type === 'isp'
    }catch(e){
        console.log(e)
        return false
    }
}

module.exports = {
    phoneIsRegistered,
    registerPhone,
    hashPhone,
    phoneMap,
    checkVerification,
    sendVerification,
    ipIsSafe,
    sync
}