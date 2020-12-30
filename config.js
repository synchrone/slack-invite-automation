module.exports = {
  // your community or team name to display on join page.
  community: process.env.COMMUNITY_NAME || 'YOUR-TEAM-NAME',
  // your slack team url (ex: socketio.slack.com)
  slackUrl: process.env.SLACK_URL || 'YOUR-TEAM.slack.com',
  // access token of slack
  // see https://github.com/outsideris/slack-invite-automation#issue-token
  //
  // You can test your token via curl:
  //   curl -X POST 'https://YOUR-SLACK-TEAM.slack.com/api/users.admin.invite' \
  //   --data 'email=EMAIL&token=TOKEN&set_active=true' \
  //   --compressed
  slacktoken: process.env.SLACK_TOKEN || 'YOUR-ACCESS-TOKEN',
  slackClientId: process.env.SLACK_CLIENT_ID || '185910655719.1598362552627',
  slackClientSecret: process.env.SLACK_CLIENT_SECRET || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  inviterUrl: process.env.INVITER_URL || 'http://localhost:3000',
  // an optional security measure - if it is set, then that token will be required to get invited.
  inviteToken: process.env.INVITE_TOKEN || null,
  // an optional security measure - if both are set, then recaptcha will be used.
  recaptchaSiteKey: process.env.RECAPTCHA_SITE || null,
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET || null,
  // an optional sms verification
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || null,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || null,
  twilioVerifyServiceId: process.env.TWILIO_VERIFY_SERVICE_ID || null,
  twilioSyncServiceId: process.env.TWILIO_SYNC_SERVICE_ID || null,
  twilioSyncMapId: process.env.TWILIO_SYNC_MAP_ID || null,
  twilioDebug: process.env.TWILIO_DEBUG || null,
  hashing: {
    timeCost: 300,
    memoryCost: 4096,
    parallelism: 2,
    salt: Buffer.from('xah$W}e%ngoanai9')
  },
  // default locale
  locale: process.env.LOCALE || "en",
  subpath: process.env.SUBPATH || "/"
};
