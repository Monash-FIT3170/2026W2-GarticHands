const app = require('./app')
const connectDB = require('./db')

const PORT = 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})