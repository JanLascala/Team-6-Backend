const express = require('express')
const router = express.Router()

const vinyl_controller = require('../controllers/vinyl_controller')

router.get('/', vinyl_controller.index)

router.get('/single-vinyl/:slug', vinyl_controller.show)

router.get('/search', vinyl_controller.filter_vinyls)

router.get('/recent', vinyl_controller.recent)

router.post('/by_genre', vinyl_controller.by_genre)

router.post('/by_format', vinyl_controller.by_format)

router.patch('/update_quantity', vinyl_controller.update_quantity)

//router.post('/', vinyl_controller.store)

//router.put('/:slug', vinyl_controller.update)



//router.delete('/:slug', vinyl_controller.destroy)

module.exports = router
