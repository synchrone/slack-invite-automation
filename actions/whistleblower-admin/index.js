const __ = require('i18n')
const config = require("../../config")
const { render } = require('../../lib/render')
const uuid = require('uuid');
const { pool } = require('../../lib/pg')

const { decrypt } = require('../../lib/crypto');

module.exports = async function (req, res) {
    const page = req.query.page || 1;
    const offset = (page - 1) * 10;

    try {
        const result = await pool.query('SELECT * FROM insights ORDER BY created_at DESC LIMIT 10 OFFSET $1', [offset])

        const data = result.rows;

        data.map(function (o) {
            o.json = decrypt(o.json);
        });

        render(res, 'whistleblower-admin/index', {
            rows: data,
            page: page,
        })
    } catch (e) {
        return render(res, 'whistleblower-admin/index', {
            messageText: __('Internal Server Error'),
            isFailedText: true,
        })
    }
}