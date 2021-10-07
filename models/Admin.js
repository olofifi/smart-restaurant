const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
    adminId:{
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },
    
    email: {
        type: String,
        required: true
    },
    
    phone: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Admin', adminSchema);