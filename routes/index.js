const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const parseAcceptLanguage = require('parse-accept-language')
const Twig = require('twig')
const crypto = require('crypto')
const i18n = require("i18n")
const config = require("../config")
const basicAuth = require('express-basic-auth')

// use https://emn178.github.io/online-tools/sha256.html to generate hashes
const authorizer = function (username, password) {
  const auth = JSON.parse(config.realmJson)
  const pwd = crypto.createHash('sha256').update(password).digest('hex')

  for (let i = 0; i < auth.length; i++) {
    const entry = auth[i]
    if (entry.username === username && basicAuth.safeCompare(pwd, entry.password)) {
      return true
    }
  }

  return false
}

const authOptions = {
  authorizer: authorizer,
  challenge: true,
};

const indexAction = require("../actions/index")
const {oauthAction, oauthBotAction} = require("../actions/oauth")
const doInviteAction = require("../actions/do-invite")
const identityCheckAction = require("../actions/identity-check")
const whistleblowerAction = require("../actions/whistleblower")
const whistleblowerAdminAction = require("../actions/whistleblower-admin/index")
const whistleblowerAdminViewAction = require("../actions/whistleblower-admin/view")
const badgeAction = require("../actions/badge")

const router = express.Router()

Twig.cache(config.cacheTemplates)
Twig.extendFunction("env", (value) => process.env[value]);
Twig.extendFunction("log", console.log);
Twig.extendFunction("__", function () {
  return i18n.__(...arguments);
});

const locales = ['ru', 'en']
i18n.configure({
  locales,
  defaultLocale: "en",
  autoReload: process.env.NODE_ENV === 'development',
  directory: __dirname + '/../locales'
});
i18n.setLocale(config.locale);
router.use(i18n.init);

// default: using 'accept-language' header to guess language settings
router.use(cookieParser());
router.use(function(req, res, next) {
  const queryLang = req.query.lang
  const cookieLang = req.cookies['lang']

  if (queryLang && locales.includes(queryLang)) {
    const options = {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    }

    res.cookie('lang', queryLang, options)

    i18n.setLocale(queryLang)
  } else if (cookieLang && i18n.getLocales().includes(cookieLang)) {
    i18n.setLocale(cookieLang)
  } else {
    const languages = parseAcceptLanguage(req)

    if (languages.length > 0) {
      i18n.setLocale(languages[0].language)
    }
  }

  next()
})

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: false }))

router.get('/', indexAction)
router.get('/oauth', oauthAction)
router.get('/oauthBot', oauthBotAction)
router.get('/whistleblower', whistleblowerAction)
router.post('/whistleblower', whistleblowerAction)
router.get('/whistleblower/admin', basicAuth(authOptions), whistleblowerAdminAction)
router.get('/whistleblower/admin/:id', basicAuth(authOptions), whistleblowerAdminViewAction)
router.post('/whistleblower/admin/:id', basicAuth(authOptions), whistleblowerAdminViewAction)
router.post('/do-invite', doInviteAction)
router.post('/identity-check', identityCheckAction)
router.get('/badge.svg', badgeAction)

module.exports = router
