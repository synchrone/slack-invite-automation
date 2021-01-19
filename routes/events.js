const express = require("express");
const { createEventAdapter } = require('@slack/events-api')
const config = require("../config")
const {slack} = require("../lib/slack")
const {sync} = require('../lib/verification')

const banMap = sync.syncMaps(config.twilioSyncBanMapId)

const slackEventAdapter = createEventAdapter(config.slackSigningSecret, {includeBody: true});
function banKey(channelId, userId){
  return `${channelId}/${userId}`
}
async function isBanned(userId, channelId, asOf){
  try{
    const ban = await banMap.syncMapItems(banKey(channelId, userId)).fetch()
    return ban.expiration > asOf
  }catch(e){
    return false
  }
}

async function ban(channelId, userId, expiration){
  await banMap.create({key: banKey(channelId, userId), data: {expiration}})
}

slackEventAdapter.on('member_joined_channel', async e => {
  const ts = parseInt(e.event_ts.replace('.', ''))
  if(await isBanned(e.user, e.channel, ts)){
    try {
      await slack.conversations.kick({channel: e.channel, user: e.user})
    }catch(e){
      console.log(e)
    }
  }
})

const router = express.Router()
router.use(slackEventAdapter.expressMiddleware())
module.exports = router
