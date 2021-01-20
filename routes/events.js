const express = require("express")
const bodyParser = require("body-parser")
const { createEventAdapter } = require('@slack/events-api')
const config = require("../config")
const {slack} = require("../lib/slack")
const {sync} = require('../lib/verification')

const bodyUrlencoded = bodyParser.urlencoded({ extended: false })
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

async function unban(channelId, userId){
  await banMap.syncMapItems(banKey(channelId, userId)).remove()
}

async function isModerator(userId, channelId){
  return false
}

async function banCommand(req, res){
  const respond = t => res.status(200).send({"response_type": "ephemeral", "text": t})

  const {text, channel_id, user_id} = req.body // <@U1234|user> in text requires escaped command text

  if(!(await isModerator(user_id, channel_id))){
    return respond('you cannot do that')
  }

  for(const user of text.matchAll(/<@(U[\d\w]+)>/i)){
    if(text.indexOf('remove') === -1) {
      await ban(user[1], channel_id)
    }else{
      await unban(user[1], channel_id)
    }
  }

  respond('done')
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
router.use('/', slackEventAdapter.expressMiddleware())
router.post('/ban', bodyUrlencoded, banCommand)
module.exports = router
