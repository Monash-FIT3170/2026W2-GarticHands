import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import messageRouter from './routes/message.js'
import submissionsRouter from './routes/submissions.js'

const app = express()
const PORT = process.env.PORT || 4000

function getMongoUri() {
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/training_submissions'
}

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(express.json())

app.use('/api/message', messageRouter)
app.use('/api/submissions', submissionsRouter)

export async function connectMongo() {
  try {
    await mongoose.connect(getMongoUri())
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error('Failed to connect to MongoDB', err)
    throw err
  }
}

async function start() {
  await connectMongo()

  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`)
  })
}

// Important: keep the module importable for tests (no auto-listen + no auto-connect).
if (process.env.NODE_ENV !== 'test') {
  void start()
}

export { app }

