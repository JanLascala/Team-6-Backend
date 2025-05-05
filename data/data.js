const mysql = require("mysql2");

const credentials = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}

const connection = mysql.createConnection(credentials)

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL!')
})

module.exports = connection