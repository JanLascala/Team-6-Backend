const connection = require('../data/data.js')
const Stripe = require('stripe')
const stripe = Stripe(process.env.STRIPE_KEY)

async function create_payment_intent(req, res) {
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

}

function create_order_entry(req, res) {
    const { customerName, customerEmail, phone, cart, paymentIntentId } = req.body;

    if (!cart || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    stripe.paymentIntents.retrieve(paymentIntentId)
        .then(paymentIntent => {

            const totalAmount = paymentIntent.metadata.totalAmount;

            if (!totalAmount) {
                return res.status(400).json({ error: 'Total amount is missing in payment intent metadata' });
            }

            const orderSql = 'INSERT INTO orders (name, email, address, phoneNumber, status, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)';
            connection.query(orderSql, [customerName, customerEmail, "TODO add address", phone, 'paid', totalAmount], (err, orderResult) => {
                if (err) return res.status(500).json({ error: err.message });

                const orderId = orderResult.insertId;

                const orderItemsSql = 'INSERT INTO order_items (order_id, vinyl_id, quantity) VALUES ?';
                const orderItemsData = cart.map(item => [orderId, item.id, item.quantity]);

                connection.query(orderItemsSql, [orderItemsData], (err) => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.status(201).json({ message: 'Order created', orderId });
                });
            });
        })
        .catch(err => {
            console.error('Error retrieving payment intent:', err);
            res.status(500).json({ error: 'Error retrieving payment intent' });
        });
}


module.exports = {
    create_payment_intent,
    create_order_entry
}