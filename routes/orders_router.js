const express = require('express')
const router = express.Router()

const orders_controller = require('../controllers/orders_controller')

router.post('/create-payment-intent', orders_controller.create_payment_intent)

router.post('/change-order-status', orders_controller.update_order_entry)



module.exports = router