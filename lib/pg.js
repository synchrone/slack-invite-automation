const config = require('../config');
const Pool = require('pg').Pool

const pool = new Pool({
    user: config.databaseUser,
    host: config.databaseHost,
    database: config.databaseName,
    password: config.databasePassword,
    port: 5432,
});

module.exports = {
    pool: pool
}
