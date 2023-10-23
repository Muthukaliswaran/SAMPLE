const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(process.env.MONGODB_CONNECT_URI,{ useNewUrlParser: true, useUnifiedTopology: true, })
        console.log("Connect to MongoDB successfully")
    } catch (error) {
        console.log("Connect failed   " + error.message )
        console.log("Connect failed   " + error.message )
    }
}

module.exports = connectDB