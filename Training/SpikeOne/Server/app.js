const express = require('express')
const cors = require('cors')

const messageRoute = require('./routes/message')
const createSubmissionsRouter = require('./routes/submission')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/message', messageRoute)
app.use('/api/submissions', createSubmissionsRouter())

module.exports = app