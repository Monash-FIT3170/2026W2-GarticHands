import express from 'express'
import cors from 'cors'
import messageRouter from './routes/message.js'
import submissionsRouter from './routes/submissions.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(express.json())

app.use('/api/message', messageRouter)
app.use('/api/submissions', submissionsRouter)

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})

