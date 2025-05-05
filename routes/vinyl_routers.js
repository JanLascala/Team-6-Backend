const express = require('express')
const router = express.Router()

const vinyl_controller = require('../controllers/vinyl_controller')

router.get('/', vinyl_controller.index)
router.get('/:slug', vinyl_controller.show)

router.post('/', vinyl_controller.store)

router.put('/:slug', vinyl_controller.update)

router.patch('/:slug', vinyl_controller.modify)

router.delete('/:slug', vinyl_controller.destroy)

module.exports = router

