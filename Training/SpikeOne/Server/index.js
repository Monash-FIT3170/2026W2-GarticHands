const express = require('express')
const cors = require('cors')
const connectDB = require('./db')

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

const messageRoute = require('./routes/message')
const submissionsRoute = require('./routes/submissions')

app.use('/api/message', messageRoute)
app.use('/api/submissions', submissionsRoute)

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
})