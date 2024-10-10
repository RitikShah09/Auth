const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email:{
        required: true,
        unique: true,
        type: String
    }
    ,
    password: {
        required: true,
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User',userSchema);