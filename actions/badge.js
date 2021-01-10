const sanitize = require('sanitize');
const {getUserCounts} = require("../lib/slack");
const {badge} = require('../lib/badge');

module.exports = async function (req, res) {
    const counts = await getUserCounts({channelName: 'general'})
    const hexColor = /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    sanitize.middleware.mixinFilters(req);

    res.type('svg');
    res.set('Cache-Control', 'max-age=0, no-cache');
    res.set('Pragma', 'no-cache');
    res.send(
      badge(
        counts.present,
        counts.all,
        req.queryPattern('colorA', hexColor),
        req.queryPattern('colorB', hexColor)
      )
    );
};
