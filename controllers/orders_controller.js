const connection = require('../data/data.js')
const Stripe = require('stripe')
const stripe = Stripe(process.env.STRIPE_KEY)
const createTransport = require('../utilities/mail-transport.js');
const transporter = createTransport();

async function create_payment_intent(req, res) {
    console.log(req.body);
    const { cart, description, customerName, customerEmail, customerPhone, customerAddress } = req.body;
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
            totalAmount += price * item.quantity * 100; // Total amount in cents
        }

        const shippingCost = 1200;
        if (totalAmount <= 10000) {
            totalAmount += shippingCost; // Add shipping cost if the total is less than $100
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

        console.log("Payment Intent created with client secret:", paymentIntent.client_secret);

        const orderSql = `
            INSERT INTO orders (name, email, address, phoneNumber, status, itemsPrice, paymentIntentId)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(orderSql, [
            customerName,
            customerEmail,
            customerAddress,
            customerPhone,
            'pending',
            totalAmount / 100, //divided by 100 to keep value in dollars
            paymentIntent.id
        ], (err, orderResult) => {
            if (err) return console.error("Order insert failed:", err.message);

            const orderId = orderResult.insertId;

            const orderItemsSql = 'INSERT INTO vinyl_order (orderId, vinylId, quantity) VALUES ?';
            const orderItemsData = cart.map(item => [orderId, item.id, item.quantity]);

            connection.query(orderItemsSql, [orderItemsData], (err) => {
                if (err) return console.error("Order items insert failed:", err.message);
                console.log(`Order ${orderId} created successfully.`);
            });

            res.send({ clientSecret: paymentIntent.client_secret, orderId });
        });

    } catch (err) {
        console.error("Payment intent creation failed:", err);
        res.status(500).json({ error: err.message });
    }
}

function update_order_entry(req, res) {
    console.log("update order status route used!")
    const { orderId } = req.body;
    console.log(`updating order ${orderId}...`)
    if (!orderId) {
        console.log(`could not find an orderId`)
        return res.status(400).json({ error: 'Order ID is required.' });
    }

    const getOrderSql = 'SELECT paymentIntentId FROM orders WHERE id = ?';

    connection.query(getOrderSql, [orderId], (err, results) => {
        if (err) {
            console.error("Error retrieving order from database:", err);
            return res.status(500).json({ error: 'Error retrieving order from database.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        const paymentIntentId = results[0].paymentIntentId;

        stripe.paymentIntents.retrieve(paymentIntentId)
            .then(paymentIntent => {
                let updateOrderSql = ''
                let status = ''
                if (paymentIntent.status === 'succeeded') {
                    updateOrderSql = 'UPDATE orders SET status = ? WHERE id = ?';
                    status = 'succeeded'
                } else if (paymentIntent.status != 'succeeded') {
                    updateOrderSql = 'UPDATE orders SET status = ? WHERE id = ?';
                    status = 'failed'
                } else {
                    return res.status(400).json({ error: 'Invalid payment status or order update status.' });
                }

                connection.query(updateOrderSql, [status, orderId], async (err) => {
                    if (err) {
                        console.error("Error updating order status:", err);
                        return res.status(500).json({ error: 'Error updating order status.' });
                    }

                    if (status === 'succeeded') {
                        try {
                            await transporter.sendMail({
                                from: '"VinylStore" <no-reply@vinylstore.com>',
                                to: process.env.MAIL_USER,
                                subject: 'Order confirmed',
                                text: `Thank you for your order! Your order number is ${orderId}.`,
                                html: `<h3>Thank you for your order!</h3><p>Your order number is <b>${orderId}</b>.</p>`
                            });
                            console.log('Payment confirmation email was sent');
                        } catch (mailErr) {
                            console.error('Email sending error:', mailErr);
                        }
                    }

                    res.status(200).json({ message: `Order status updated to ${status}.` });
                });

            })
            .catch(err => {
                console.error('Error retrieving payment intent:', err);
                res.status(500).json({ error: 'Error retrieving payment intent from Stripe.' });
            });
    });
}

module.exports = {
    create_payment_intent,
    update_order_entry
}