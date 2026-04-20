import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import messageRouter from './routes/message.js'
import submissionsRouter from './routes/submissions.js'

const app = express()
const PORT = process.env.PORT || 4000
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/training_submissions'

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(express.json())

app.use('/api/message', messageRouter)
app.use('/api/submissions', submissionsRouter)

async function start() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to connect to MongoDB', err)
    process.exit(1)
  }
}

void start()

