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
  if(config.globalModerators.indexOf(user) > -1){
    return true
  }

  const chan = config.moderators[channel]
  return chan && (chan === user || chan.indexOf(user) > -1)
}
function sendBanMessage(user, channel, bannedUntil){
  const fallbackTs = DateTime.fromMillis(bannedUntil).toLocaleString(DateTime.DATETIME_SHORT)
  const ts = Math.ceil(bannedUntil / 1000)

  return slack.chat.postMessage({
    as_user: false,
    channel: user,
    text:  bannedUntil ?
      __('You are banned in %s until %s',`<#${channel}>`, `<!date^${ts}^{date} {time_secs}|${fallbackTs}>`) :
      __('You are banned in %s',`<#${channel}>`)
  })
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

  const durationMatch = text.match(/\s+(P[0-9A-Z]{2,})/)
  const parsedDuration = durationMatch ? durationMatch[1] : 'P1W';
  const banDuration = Duration.fromISO(parsedDuration)
  if(banDuration.invalid){
    return respond('ban duration must be ISO8601, we got '+parsedDuration)
  }

  for(const userIdMatch of text.matchAll(/<@(U[0-9A-Z]+).*>/i)){
    const user = userIdMatch[1]
    if(text.indexOf('remove') === -1) {
      const bannedUntil = DateTime.utc().plus(banDuration).toMillis()
      await ban({user, channel: channel_id}, bannedUntil)
      try {
        await slack.conversations.kick({channel: channel_id, user: user})
      }catch (e) {
        if(e.data.error !== 'not_in_channel'){
          throw e
        }
      }
      await sendBanMessage(user, channel_id, bannedUntil)
    }else{
      await unban({user, channel: channel_id})
      await slack.conversations.invite({channel: channel_id, users: user})
    }
  }

  respond('done')
}

slackEventAdapter.on('member_joined_channel', async e => {
  let bannedUntil = await getBan(e)
  if(bannedUntil !== false && bannedUntil > +new Date){
    try {
      await slack.conversations.kick({channel: e.channel, user: e.user})
      await sendBanMessage(e.user, e.channel, bannedUntil)
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
        username: 'Anonymous',
        phrase: 'Hi, in the <#%s> channel special rules are apply: you can only leave messages in threads. Messages at the first level are automatically deleted. Thank you for your understanding.',
        locale: 'ru'
      }, config.slackInsightsChannel)
    });
  } catch (e) {

  }
})

const router = express.Router()

router.post('/', slackEventAdapter.expressMiddleware())
router.post('/ban', bodyUrlencoded, banCommand)

module.exports = router
