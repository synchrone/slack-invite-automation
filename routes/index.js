const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const parseAcceptLanguage = require('parse-accept-language')
const Twig = require('twig')
const i18n = require("i18n")

const indexAction = require("../actions/index")
const {oauthAction, oauthBotAction} = require("../actions/oauth")
const doInviteAction = require("../actions/do-invite")
const identityCheckAction = require("../actions/identity-check")
const badgeAction = require("../actions/badge")
const config = require("../config")

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
router.post('/do-invite', doInviteAction)
router.post('/identity-check', identityCheckAction)
router.get('/badge.svg', badgeAction)

module.exports = router
