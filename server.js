const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
require('dotenv').config()
const app = express()
const stripe = Stripe(process.env.STRIPE_KEY)
const port = 3000
const vinyl_routers = require('./routes/vinyl_routers')
const errorsHandler = require('./middlewares/errors.js')
const notFound = require('./middlewares/error404.js')

app.use(cors())

app.listen(port, () => {
    console.log(`server is running on http://localhost:${port} `)
})

app.get("/api", (req, res) => {
    res.send("welcome to my api")
})

app.post('/create-payment-intent', async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2000,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
        });

        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use(express.json());
app.use(express.static('public'))
app.use('/api/vinyls', vinyl_routers)

//middlewares

app.use(errorsHandler)
app.use(notFound)