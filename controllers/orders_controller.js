const connection = require('../data/data.js')
const Stripe = require('stripe')
const stripe = Stripe(process.env.STRIPE_KEY)
const createTransport = require('../utilities/mail-transport.js');
const transporter = createTransport();

async function create_payment_intent(req, res) {
    console.log(req.body);
    const { cart, description, customerName, customerEmail, customerPhone, customerAddress } = req.body;
    console.log("create payment route used!");

    // Basic validations
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty or not valid.' });
    }

    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
        return res.status(400).json({ error: 'Customer name is required and must be at least 2 characters.' });
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        return res.status(400).json({ error: 'Valid email is required.' });
    }

    if (!customerPhone || !/^\+?[0-9\s\-()]{7,15}$/.test(customerPhone)) {
        return res.status(400).json({ error: 'Valid phone number is required.' });
    }

    if (!customerAddress || typeof customerAddress !== 'string' || customerAddress.trim().length < 5) {
        return res.status(400).json({ error: 'Customer address is required and must be at least 5 characters.' });
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
            if (!item.id || typeof item.quantity !== 'number' || item.quantity <= 0) {
                return res.status(400).json({ error: 'Cart item must include valid id and quantity.' });
            }
            const price = await getPrice(item.id);
            totalAmount += price * item.quantity * 100; // in cents
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
            totalAmount / 100,
            paymentIntent.id
        ], (err, orderResult) => {
            if (err) {
                console.error("Order insert failed:", err.message);
                return res.status(500).json({ error: `Failed to create order. ${err}}` });
            }

            const orderId = orderResult.insertId;

            const orderItemsSql = 'INSERT INTO vinyl_order (orderId, vinylId, quantity) VALUES ?';
            const orderItemsData = cart.map(item => [orderId, item.id, item.quantity]);

            connection.query(orderItemsSql, [orderItemsData], (err) => {
                if (err) {
                    console.error("Order items insert failed:", err.message);
                    return res.status(500).json({ error: 'Failed to insert order items.' });
                }

                console.log(`Order ${orderId} created successfully.`);
                res.send({ clientSecret: paymentIntent.client_secret, orderId });
            });
        });

    } catch (err) {
        console.error("Payment intent creation failed:", err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
}


function update_order_entry(req, res) {
    console.log("update order status route used!")
    const { customerName, customerEmail, customerPhone, customerAddress } = req.body;
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
                                to: customerEmail,
                                subject: 'Order confirmed',
                                text: `Thank you for your order at VinylStore, ${customerName}!\n\n` +
                                    `We're happy to confirm that your payment has been processed successfully.\n\n` +
                                    `Order Details:\n` +
                                    `Order Number: ${orderId}\n` +
                                    `Order Date: ${new Date().toLocaleDateString()}\n` +
                                    `Order Status: Confirmed\n\n` +
                                    `Customer Info:\n` +
                                    `Name: ${customerName}\n` +
                                    `Email: ${customerEmail}\n` +
                                    `Phone: ${customerPhone}\n` +
                                    `Address: ${customerAddress}\n\n` +
                                    `We'll send you another notification when your order ships. You can expect your items to arrive within 5-7 business days.\n\n` +
                                    `If you have any questions about your order, please contact our customer service team at support@vinylstore.com or call us at (555) 123-4567.\n\n` +
                                    `Thank you for shopping with VinylStore!\n\n` +
                                    `The VinylStore Team`,
                                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                                        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;">
                                            <h2 style="color: #333;">Order Confirmation</h2>
                                            <p style="color: #666;">Thank you for your purchase, ${customerName}!</p>
                                        </div>
                                        
                                        <div style="padding: 20px 0;">
                                            <p>We're happy to confirm that your payment has been processed successfully.</p>
                                            
                                            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                                <h3 style="margin-top: 0; color: #333;">Order Summary</h3>
                                                <p><strong>Order Number:</strong> #${orderId}</p>
                                                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                                                <p><strong>Status:</strong> Confirmed</p>
                                            </div>
                            
                                            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                                <h3 style="margin-top: 0; color: #333;">Customer Information</h3>
                                                <p><strong>Name:</strong> ${customerName}</p>
                                                <p><strong>Email:</strong> ${customerEmail}</p>
                                                <p><strong>Phone:</strong> ${customerPhone}</p>
                                                <p><strong>Address:</strong> ${customerAddress}</p>
                                            </div>
                                            
                                            <p>We'll send you another notification when your order ships. You can expect your items to arrive within 5-7 business days.</p>
                                            
                                            <p>If you need to return or exchange any items, please refer to our return policy on our website or contact customer service.</p>
                                        </div>
                                        
                                        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                            <p style="margin: 0;">Questions about your order? Contact our customer service team at 
                                            <a href="mailto:support@vinylstore.com">support@vinylstore.com</a> or call us at (555) 123-4567.</p>
                                        </div>
                                        
                                        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #777;">
                                            <p>Thank you for shopping with VinylStore!</p>
                                            <p>&copy; ${new Date().getFullYear()} VinylStore. All rights reserved.</p>
                                        </div>
                                    </div>`
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