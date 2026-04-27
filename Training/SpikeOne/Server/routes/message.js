const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'This message is from the backend server' })
})

module.exports = router 