const express = require('express');
const router = express.Router();

const indexAction = require("../actions/index");
const oauthAction = require("../actions/oauth");
const doInviteAction = require("../actions/do-invite");
const identityCheckAction = require("../actions/identity-check");
const badgeAction = require("../actions/badge");

router.get('/', (req, res) => indexAction(req, res));
router.get('/oauth', (req, res) => oauthAction(req, res));
router.post('/do-invite', async (req, res) => doInviteAction(req, res));
router.post('/identity-check', async (req, res) => identityCheckAction(req, res));
router.get('/badge.svg', (req, res) => badgeAction(req, res));

module.exports = router;
