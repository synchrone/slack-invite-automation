const config = require('../config')
const { WebClient } = require('@slack/web-api')
const slack = new WebClient(config.slacktoken)

async function paginate(method, key, params){
  let cursor = undefined
  const result = []
  do {
    const response = await method({...params, cursor})
    if(!response['ok']){
      throw new Error(response)
    }

    for(const e of response[key]){
      result.push(e)
    }

    cursor = response['response_metadata'] ? response['response_metadata']['next_cursor']: undefined
  } while(cursor)
  return result
}

function invite(email, real_name){
  return slack.apiCall('users.admin.invite', {email, real_name, setActive: true})
}

async function getUserCounts({channelId, channelName}){
  if(!channelId){
    const convos = await paginate(slack.conversations.list, 'channels')
    channelId = convos.find(c => c.name === channelName).id
  }

  const users = await paginate(slack.conversations.members, 'members', {channel: channelId})

  const counters = {present: 0, all: 0}
  const promises = []
  for(const user of users){
    promises.push(slack.users.getPresence({user}))
  }

  let presences = await Promise.all(promises);
  for(const p of presences){
    counters.all++;
    if(p.presence === 'active'){
      counters.present++;
    }
  }
  return counters
}

module.exports = {
  slack,
  invite,
  getUserCounts,
}
