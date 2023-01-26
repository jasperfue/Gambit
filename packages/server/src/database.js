
const Pool = require('pg').Pool

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Gambit',
    password: 'Hotdogjette.2019',
    port: 5432,
})

const query = (text, params) => pool.query(text, params)

module.exports = { query }