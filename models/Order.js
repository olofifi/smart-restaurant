const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    
    item:{
    img: { 
        data: Buffer, 
        contentType: String
    },

    productName:{
        type: String,
        required: true
    },

    productDesc:{
        type: String,
        required: true
    },

    productPrice:{
        type: Number,
        required: true
    },
    productType:{
        type: String,
        required: true
    },

},
qty: Number,
});

const orderSchema = mongoose.Schema({
    
    products: [productSchema],

    totalPrice: Number,

    paymentDone: {
        type: Boolean,
        default: false,
    },

    orderStatus: {
        type: String,
        default: 'awaiting',
        
    },

    table: {
        type: String,
        default: 'takeaway'
    },
    
    date: {
        type: Date,
        default: Date.now

    }
});

module.exports = mongoose.model('Order', orderSchema);