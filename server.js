const express = require('express')
const app = express()
const port = 3000
const vinyl_routers = require('./routes/vinyl_routers')
const errorsHandler = require('./middlewares/errors.js')
const notFound = require('./middlewares/error404.js')

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port} `)
})

app.get("/api", (req, res) => {
    res.send("welcome to my api")
})

app.use(express.json());
app.use(express.static('public'))
app.use('/api/vinyls', vinyl_routers)

//middlewares

app.use(errorsHandler)
app.use(notFound)