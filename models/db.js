const mongoose = require('mongoose');

exports.connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB Connected');
        
    } catch (error) {
        console.log('Error connecting to MongoDB');
    }
}