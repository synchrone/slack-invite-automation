const express = require("express")
const bodyParser = require("body-parser")
const __ = require('i18n').__
const { createEventAdapter } = require('@slack/events-api')
const config = require("../config")
const {slack} = require("../lib/slack")
const {sync} = require('../lib/verification')


const bodyUrlencoded = bodyParser.urlencoded({ extended: false })
const banMapItems = sync.syncMaps(config.twilioSyncBanMapId).syncMapItems

const slackEventAdapter = createEventAdapter(config.slackSigningSecret, {includeBody: true});

function banKey({channel, user}){
  return `${channel}_${user}`
}

async function getBan({user, channel}, asOf){
  try{
    const ban = await banMapItems(banKey({user, channel})).fetch()
    return ban.expiration
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
  return true
}

async function banCommand(req, res){
  const respond = t => res.status(200).send({"response_type": "ephemeral", "text": t})

  const {text, channel_id, user_id} = req.body // <@U1234|user> in text requires escaped command text

  if(!(await isModerator({user: user_id, channel: channel_id}))){
    return respond('you cannot do that')
  }

  for(const userIdMatch of text.matchAll(/<@(U[0-9A-Z]+).*>/i)){
    const user = userIdMatch[1]
    if(text.indexOf('remove') === -1) {
      await ban({user, channel: channel_id})
      await slack.conversations.kick({channel: channel_id, user: user})
    }else{
      await unban({user, channel: channel_id})
      await slack.conversations.invite({channel: channel_id, users: user})
    }
  }

  respond('done')
}

slackEventAdapter.on('member_joined_channel', async e => {
  const ts = parseInt(e.event_ts.replace('.', ''))

  let bannedUntil = await getBan(e, ts);
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
