const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = 3000

const vinyl_router = require('./routes/vinyl_router.js')
const orders_router = require('./routes/orders_router.js')
const errorsHandler = require('./middlewares/errors.js')
const notFound = require('./middlewares/error404.js')

app.use(cors())

app.use(express.json());
app.use(express.static('public'))

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port} `)
})

app.get("/api", (req, res) => {
    res.send("welcome to my api")
})

app.use('/api/vinyls', vinyl_router)
app.use('/orders', orders_router)

//middlewares

app.use(errorsHandler)
app.use(notFound)