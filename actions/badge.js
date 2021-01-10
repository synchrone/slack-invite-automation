const sanitize = require('sanitize')
const NodeCache = require('node-cache')
const {getUserCounts} = require('../lib/slack')
const {badge} = require('../lib/badge')

const cache = new NodeCache({stdTTL: 120});

module.exports = async function (req, res) {
    let counts = cache.get('counts')
    if(!counts) {
        counts = await getUserCounts({channelName: 'general'})
        cache.set('counts', counts)
    }

    const hexColor = /^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    sanitize.middleware.mixinFilters(req);

    res.type('svg')
    res.set('Cache-Control', 'max-age=0, no-cache')
    res.set('Pragma', 'no-cache')
    res.send(
      badge(
        counts.present,
        counts.all,
        req.queryPattern('colorA', hexColor),
        req.queryPattern('colorB', hexColor)
      )
    )
}
