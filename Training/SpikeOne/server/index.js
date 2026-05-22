const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3001

// Middleware
app.use(cors()) 
app.use(express.json())

// Routes
app.use('/api/message', require('./routes/message'))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
