const connectDB = require('./db')

const app = express()
const PORT = 5000

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
})