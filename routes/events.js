const express = require("express")
const bodyParser = require("body-parser")
const __ = require('i18n').__
const { createEventAdapter } = require('@slack/events-api')
const {DateTime, Duration} = require("luxon")

const config = require("../config")
const {slack} = require("../lib/slack")
const {sync} = require('../lib/verification')


const bodyUrlencoded = bodyParser.urlencoded({ extended: false })
const banMapItems = sync.syncMaps(config.twilioSyncBanMapId).syncMapItems

const slackEventAdapter = createEventAdapter(config.slackSigningSecret, {includeBody: true});

function banKey({channel, user}){
  return `${channel}_${user}`
}

async function getBan({user, channel}){
  try{
    const ban = await banMapItems(banKey({user, channel})).fetch()
    return ban.data.expiration
  }catch(e){
    if(e.status !== 404){ // is not banned in map
      throw e
    }
    return false
  }
}

async function ban({user, channel}, expiration){
  try {
    await banMapItems.create({key: banKey({user, channel}), data: {expiration}})
  }catch(e){
    if(e.status !== 409){ // already banned
      throw e
    }
  }
}

async function unban({user, channel}){
  try {
    await banMapItems(banKey({user, channel})).remove()
  }catch(e){
    if(e.status !== 404){ // is not banned in map
      throw e
    }
  }
}

async function isModerator({user, channel}){
  const chan = config.moderators[channel]
  return chan && (chan === user || chan.indexOf(user) > -1)
}

async function banCommand(req, res){
  const respond = t => res.status(200).send({"response_type": "ephemeral", "text": t})

  const {text, channel_id, user_id, ssl_check} = req.body // <@U1234|user> in text requires escaped command text
  if(ssl_check) {
    return respond('ok')
  }

  if(!(await isModerator({user: user_id, channel: channel_id}))){
    return respond('you cannot do that')
  }

  const durationMatch = text.match(/(P[0-9A-Z]{2,})/)
  const banDuration = Duration.fromISO(durationMatch ? durationMatch[1] : 'P1W')
  if(banDuration.invalid){
    return respond('ban duration must be ISO8601')
  }

  for(const userIdMatch of text.matchAll(/<@(U[0-9A-Z]+).*>/i)){
    const user = userIdMatch[1]
    if(text.indexOf('remove') === -1) {
      await ban({user, channel: channel_id}, DateTime.local().plus(banDuration).toMillis())
      try {
        await slack.conversations.kick({channel: channel_id, user: user})
      }catch (e) {
        if(e.data.error !== 'not_in_channel'){
          throw e
        }
      }
    }else{
      await unban({user, channel: channel_id})
      await slack.conversations.invite({channel: channel_id, users: user})
    }
  }

  respond('done')
}

slackEventAdapter.on('member_joined_channel', async e => {
  let bannedUntil = await getBan(e)
  if(bannedUntil !== false){
    try {
      await slack.conversations.kick({channel: e.channel, user: e.user})
      await slack.chat.postMessage({
        as_user: false,
        channel: e.user,
        text:  bannedUntil ?
          __('You are banned in %s until %s',`<#${e.channel}>`, new Date(bannedUntil).toLocaleString()) :
          __('You are banned in %s',`<#${e.channel}>`)
      })
    }catch(e){
      console.log(e)
    }
  }
})

const router = express.Router()
router.post('/', slackEventAdapter.expressMiddleware())
router.post('/ban', bodyUrlencoded, banCommand)
module.exports = router
