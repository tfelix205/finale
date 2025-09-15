const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true

    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    profilePicture: {
        imageUrl: {
            type: String
        },
        publicId: {
            type: String
        }

    }

}, {Timestamp: true});


const userModel = mongoose.model('user', userSchema)
module.exports = userModel