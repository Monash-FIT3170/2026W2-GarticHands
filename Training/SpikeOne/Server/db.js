const mongoose = require('mongoose')

async function connectDB() {
  try {
    await mongoose.connect('mongodb+srv://bdro0002_db_user:Bailey0717@cluster0.hx6xc8f.mongodb.net/?appName=Cluster0')
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

module.exports = connectDB