const express = require('express');
const router = express.Router();
const request = require('request');
const sanitize = require('sanitize');
const argon2 = require('argon2');

const config = require('../config');
const { badge } = require('../lib/badge');

let twilio = require('twilio')(config.twilioAccountSid, config.twilioAuthToken);
const verify = twilio.verify.services(config.twilioVerifyServiceId)
const phoneMap = twilio.sync.services(config.twilioSyncServiceId).syncMaps(config.twilioSyncMapId)

let renderIndex = function(res, params = {}) {
  res.setLocale(config.locale);
  res.render('index', { ...params,
    community: config.community,
    tokenRequired: !!config.inviteToken,
    recaptchaSiteKey: config.recaptchaSiteKey,
    smsRequired: !!config.twilioVerifyServiceId });
};

async function hashPhone(phone){
  const start = +new Date
  const result = await argon2.hash(phone, { type: argon2.argon2id, ...config.hashing})
  console.log('hashing done in ', (+new Date - start))
  return result
}

async function phoneIsRegistered(phone){
  try {
    await phoneMap.syncMapItems(await hashPhone(phone)).fetch()
  } catch(e) {
    if (e.status !== 404) { throw e }
    return false
  }
  return true
}

async function registerPhone(phone){
  await phoneMap.syncMapItems.create({key: await hashPhone(phone), data: {}})
}

router.get('/', (req, res) => renderIndex(res));

router.get('/oauth', (req, res) => {
  //this endpoint helps getting the slacktoken for config
  if(!req.query.code){
    res.redirect(`https://${config.slackUrl}/oauth?client_id=${config.slackClientId}&scope=client&user_scope=admin&redirect_uri=${config.inviterUrl}/oauth`)
  }else{
    request.post({
      url: 'https://'+ config.slackUrl + '/api/oauth.access',
      form: {
        code: req.query.code,
        client_id: config.slackClientId,
        client_secret: config.slackClientSecret
      }
    }, (err, httpResp, body) => {
      res.status(httpResp.statusCode).send(body)
    })
  }
})

router.post('/invite', async function(req, res) {
  if (req.body.email && (!config.inviteToken || (!!config.inviteToken && req.body.token === config.inviteToken))) {
    const email = req.body.email;

    function doInvite(cb) {
      request.post({
          url: 'https://'+ config.slackUrl + '/api/users.admin.invite',
          form: {
            email: email,
            token: config.slacktoken,
            set_active: true
          }
        }, function(err, httpResponse, body) {
          // body looks like:
          //   {"ok":true}
          //       or
          //   {"ok":false,"error":"already_invited"}
          if (err) { return res.send('Error:' + err); }
          body = JSON.parse(body);
          if (body.ok) {
            res.render('result', {
              community: config.community,
              message: 'Success! Check &ldquo;'+ email +'&rdquo; for an invite from Slack.'
            });
          } else {
            let error = body.error;
            if (error === 'already_invited' || error === 'already_in_team') {
              res.render('result', {
                community: config.community,
                message: 'Success! You were already invited.<br>' +
                        'Visit <a href="https://'+ config.slackUrl +'">'+ config.community +'</a>'
              });
              return;
            } else if (error === 'invalid_email') {
              error = 'The email you entered is an invalid email.';
            } else if (error === 'invalid_auth') {
              error = 'Something has gone wrong. Please contact a system administrator.';
            }

            res.render('result', {
              community: config.community,
              message: 'Failed! ' + error,
              isFailed: true
            });
          }
          cb(body.ok)
        });
    }

    if(!!config.twilioVerifyServiceId) {
      let phone = req.body.phone;
      let check = {status: 'not_found'}

      try {
        check = await verify.verificationChecks.create({
          to: phone,
          code: req.body.smsToken
        })
        console.log(check)
      }catch(e){
        console.log(e)
      }

      if (check.status === 'approved' || config.twilioDebug) {
        doInvite(async ok => {
          if(!ok && !config.twilioDebug) return;
          await registerPhone(phone)
        });
      } else {
        return res.render('result', {
          community: config.community,
          message: 'Failed to verify SMS',
          isFailed: true
        });
      }
    } else {
      doInvite();
    }
  } else {
    const errMsg = [];
    if (!req.body.email) {
      errMsg.push('your email is required');
    }

    if (!!config.inviteToken) {
      if (!req.body.token) {
        errMsg.push('valid token is required');
      }

      if (req.body.token && req.body.token !== config.inviteToken) {
        errMsg.push('the token you entered is wrong');
      }
    }

    res.render('result', {
      community: config.community,
      message: 'Failed! ' + errMsg.join(' and ') + '.',
      isFailed: true
    });
  }
});

if(!!config.twilioVerifyServiceId) {
  router.post('/sendSms', async (req, res) => {
    const phone = req.body.phone.replace(/[^0-9+]/g, '');
    try {
      if (await phoneIsRegistered(phone)) {
        return res.render('result', {
          community: config.community,
          message: phone + ' is already registered to someone',
          isFailed: true
        });
      }

      const carrierInfo = await twilio.lookups.phoneNumbers(phone).fetch({type: 'carrier'})
      if(carrierInfo.carrier.type !== 'mobile'){
        throw new Error('carrier is not mobile')
      }

      const smsCheck = await verify.verifications.create({to: phone, channel: 'sms'})
      console.log(smsCheck)
      renderIndex(res, {phone});
    }catch(e){
      console.log(e)
      res.render('result', {
        community: config.community,
        message: 'Cannot send SMS verification to ' + phone,
        isFailed: true
      });
    }
  });
}

router.get('/badge.svg', (req, res) => {
  request.get({
    url: 'https://'+ config.slackUrl + '/api/users.list',
    qs: {
      token: config.slacktoken,
      presence: true
    }
  }, function(err, httpResponse, body) {
    try {
      body = JSON.parse(body);
    } catch(e) {
      return res.status(404).send('');
    }
    if (!body.members) {
      return res.status(404).send('');
    }

    const members = body.members.filter(function(m) {
      return !m.is_bot;
    });
    const total = members.length;
    const presence = members.filter(function(m) {
      return m.presence === 'active';
    }).length;

    const hexColor = /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    sanitize.middleware.mixinFilters(req);

    res.type('svg');
    res.set('Cache-Control', 'max-age=0, no-cache');
    res.set('Pragma', 'no-cache');
    res.send(
        badge(
            presence,
            total,
            req.queryPattern('colorA', hexColor),
            req.queryPattern('colorB', hexColor)
        )
    );
  });
});

module.exports = router;

