const express = require('express')
const router = express.Router()
const { subscribe, test, getPublicKey } = require('../controllers/pushController')

router.get('/public-key', getPublicKey)
router.post('/subscribe', subscribe)
router.post('/test', test)

module.exports = router
