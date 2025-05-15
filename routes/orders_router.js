const express = require('express')
const router = express.Router()

const orders_controller = require('../controllers/orders_controller')

router.post('/create-payment-intent', orders_controller.create_payment_intent)

router.post('/change-order-status', orders_controller.update_order_entry)

router.post('/capture-payment', orders_controller.capture_payment);

router.post('/cancel-payment', orders_controller.cancel_payment);

module.exports = router