const querystring = require("querystring");

module.exports = {
  env: process.env.APP_ENV || 'dev',
  // your community or team name to display on join page.
  community: process.env.COMMUNITY_NAME || 'YOUR-TEAM-NAME',
  // your slack team url (ex: socketio.slack.com)
  slackUrl: process.env.SLACK_URL || 'YOUR-TEAM.slack.com',
  // access token of slack: use localhost:3000/oauth
  //
  // You can test your token via curl:
  //   curl -X POST 'https://YOUR-SLACK-TEAM.slack.com/api/users.admin.invite' \
  //   --data 'email=EMAIL&token=TOKEN&set_active=true' \
  //   --compressed
  slacktoken: process.env.SLACK_TOKEN || 'YOUR-ACCESS-TOKEN',
  slackClientId: process.env.SLACK_CLIENT_ID,
  slackClientSecret: process.env.SLACK_CLIENT_SECRET,
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
  slackInsightsChannel: process.env.SLACK_INSIGHTS_CHANNEL,
  inviterUrl: process.env.INVITER_URL || 'http://localhost:3000',
  // an optional security measure - if it is set, then that token will be required to get invited.
  inviteToken: process.env.INVITE_TOKEN || null,
  // an optional security measure - if both are set, then recaptcha will be used.
  recaptchaSiteKey: process.env.RECAPTCHA_SITE || null,
  recaptchaSiteKeyV2: process.env.RECAPTCHA_SITE_v2 || null,
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET || null,
  recaptchaSecretKeyV2: process.env.RECAPTCHA_SECRET_V2 || null,
  recaptchaThreshold: process.env.RECAPTCHA_THRESHOLD || '0.2',
  // an optional sms verification
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || null,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || null,
  twilioVerifyServiceId: process.env.TWILIO_VERIFY_SERVICE_ID || null,
  twilioSyncServiceId: process.env.TWILIO_SYNC_SERVICE_ID || null,
  twilioSyncMapId: process.env.TWILIO_SYNC_MAP_ID || null,
  twilioSyncBanMapId: process.env.TWILIO_SYNC_BAN_MAP_ID,
  twilioDebug: process.env.TWILIO_DEBUG || null,
  ipLookup: process.env.IP_LOOKUP,
  hashing: {
    timeCost: 300,
    memoryCost: 4096,
    parallelism: 2,
    salt: Buffer.from(process.env.HASH_SALT || '')
  },
  // default locale
  locale: process.env.LOCALE || "en",
  subpath: process.env.SUBPATH || "/",
  eventsPath: process.env.SUBPATH || "/events",
  requireHttps: process.env.REQUIRE_HTTPS || '',
  cacheTemplates: process.env.CACHE_TEMPLATES === 'true',
  cryptoSecretKey: process.env.CRYPTO_SECRET_KEY || '=CJ=et7JWe%EfCAbr3gSD8+4?QT?5gSz',
  databaseHost: process.env.DATABASE_HOST || 'db',
  databaseUser: process.env.DATABASE_USER || 'postgres',
  databasePassword: process.env.DATABASE_PASSWORD || 'password',
  databaseName: process.env.DATABASE_NAME || 'insights',
  realmJson: process.env.REALM_JSON,
  globalModerators: (process.env.GLOBAL_MODERATORS || '').split(','),
  moderators: querystring.parse(process.env.MODERATORS)
};
