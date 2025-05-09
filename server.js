const express = require('express')
const cors = require('cors')
const Stripe = require('stripe')
require('dotenv').config()
const connection = require('./data/data.js')
const app = express()
const stripe = Stripe(process.env.STRIPE_KEY)
const port = 3000
const vinyl_routers = require('./routes/vinyl_routers')
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

app.post('/create-payment-intent', async (req, res) => {
    console.log(req.body);
    const { cart, description, customerName, customerEmail } = req.body;
    console.log("create payment route used!");

    if (!cart || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    try {
        const getPrice = (id) => {
            return new Promise((resolve, reject) => {
                connection.query('SELECT price FROM vinyls WHERE id = ?', [id], (err, results) => {
                    if (err) return reject(err);
                    if (results.length === 0) return reject(new Error(`Item with id ${id} not found`));
                    resolve(results[0].price);
                });
            });
        };

        let totalAmount = 0;
        for (const item of cart) {
            const price = await getPrice(item.id);
            totalAmount += price * item.quantity * 100;
        }

        const shippingCost = 1200;
        if (totalAmount <= 10000) {
            totalAmount += shippingCost;
            console.log("Shipping cost added");
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            description,
            metadata: {
                customerName,
                customerEmail
            }
        });

        console.log("Client secret sent!");
        res.send({ clientSecret: paymentIntent.client_secret });

    } catch (err) {
        console.error("Payment intent creation failed:", err);
        res.status(500).json({ error: err.message });
    }
});


app.use('/api/vinyls', vinyl_routers)




//middlewares

app.use(errorsHandler)
app.use(notFound)