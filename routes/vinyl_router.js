const express = require('express')
const router = express.Router()

const vinyl_controller = require('../controllers/vinyl_controller')

router.get('/', vinyl_controller.index)

router.get('/recent', vinyl_controller.recent)

router.get('/:slug', vinyl_controller.show)

router.post('/by_genre', vinyl_controller.by_genre)

router.post('/', vinyl_controller.store)

router.put('/:slug', vinyl_controller.update)

router.patch('/:slug', vinyl_controller.modify)

router.delete('/:slug', vinyl_controller.destroy)

module.exports = router
