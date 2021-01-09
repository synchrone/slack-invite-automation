const { render } = require('../lib/render');

module.exports = function (req, res) {
    render(res, 'index');
};
