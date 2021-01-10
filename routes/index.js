const express = require('express')
const bodyParser = require('body-parser')

const router = express.Router();

const indexAction = require("../actions/index");
const oauthAction = require("../actions/oauth");
const doInviteAction = require("../actions/do-invite");
const identityCheckAction = require("../actions/identity-check");
const badgeAction = require("../actions/badge");

router.use(cookieParser());
router.use(function(req, res, next) {
  const queryLang = req.query.lang;
  const cookieLang = req.cookies['lang'];

  if (queryLang && locales.includes(queryLang)) {
    const options = {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    };

    res.cookie('lang', queryLang, options);

    i18n.setLocale(queryLang);
  } else if (cookieLang && locales.includes(cookieLang)) {
    i18n.setLocale(cookieLang);
  } else {
    const languages = parseAcceptLanguage(req);

    if (languages.length > 0) {
      i18n.setLocale(languages[0].language);
    }
  }

  next();
});
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.get('/', (req, res) => indexAction(req, res));
router.get('/oauth', (req, res) => oauthAction(req, res));
router.post('/do-invite', async (req, res) => doInviteAction(req, res));
router.post('/identity-check', async (req, res) => identityCheckAction(req, res));
router.get('/badge.svg', (req, res) => badgeAction(req, res));

module.exports = router;
