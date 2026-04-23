const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 5000

app.use(cors())

const messageRoute = require('./routes/message')
app.use('/api/message', messageRoute)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})