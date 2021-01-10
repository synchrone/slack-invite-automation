const express = require("express");
const { createEventAdapter } = require('@slack/events-api')
const config = require("../config");
const {slack} = require("../lib/slack");

const router = express.Router();
router.use(createEventAdapter(config.slackSigningSecret).expressMiddleware());

async function isBanned(userId, channelId){
  return channelId === 'C5F5BTJUV'
}

router.post('*', async function (req, res) {
  const e = req.body.event;
  if(e.type === 'member_joined_channel' && await isBanned(e.user)){
    await slack.conversations.kick({channel: e.channel, user: e.user})
    return res.status(200).send()
  }
})

module.exports = router