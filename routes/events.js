const express = require("express")
const bodyParser = require("body-parser")
const { createEventAdapter } = require('@slack/events-api')

const config = require("../config")
const { slack } = require("../lib/slack")
const {sync} = require('../lib/verification')


const bodyUrlencoded = bodyParser.urlencoded({ extended: false })
const banMap = sync.syncMaps(config.twilioSyncBanMapId)

const __ = require('i18n').__;

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

slackEventAdapter.on('message', async e => {
  if (config.slackInsightsChannel === null) {
    throw new Error('Slack channel is not defined.');
  }

  if (e.channel !== config.slackInsightsChannel) {
    return;
  }

  if (e.subtype && ['message_deleted', 'message_changed', 'channel_leave', 'channel_join', 'bot_message'].includes(e.subtype)) {
    return;
  }

  if (e.thread_ts) { // thread
    return;
  }

  try {
    await slack.chat.delete({ ts: e.event_ts, channel: e.channel });
    await slack.chat.postMessage({
      channel: e.user,
      text: __({
        phrase: 'Hi, in the <#%s> channel special rules are apply: you can only leave messages in threads. Messages at the first level are automatically deleted. Thank you for your understanding.',
        locale: 'ru'
      }, config.slackInsightsChannel)
    });
  } catch (e) {

  }
})

const router = express.Router()

router.use('/', slackEventAdapter.expressMiddleware())
router.post('/ban', bodyUrlencoded, banCommand)

module.exports = router
