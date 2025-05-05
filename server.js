const express = require('express')
const app = express()
const port = 3000
const vinyl_routers = require('./routes/vinyl_routers')

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port} `)
})

app.get("/", (req, res) => {
    res.send("welcome to my api")
})

app.use('/vinyls', vinyl_routers)

app.use(express.json());
app.use(express.static('public'))