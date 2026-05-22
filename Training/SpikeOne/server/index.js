require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/message', require('./routes/message'))
app.use('/api/submissions', require('./routes/submissions'))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})