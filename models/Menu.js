const mongoose = require('mongoose');

const productSchema = mongoose.Schema({

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
    }

});

module.exports = productSchema;
module.exports = mongoose.model('Menu', productSchema);