require('dotenv').config()
const Pool = require('pg').Pool

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
})

const query = (text, params) => pool.query(text, params)

module.exports = { query }