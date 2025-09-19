const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    productImages:[ {
        imageUrl:{type:String, required: true},
        publicId:{type: String, required:true}
    }]
}, {timestamps: true})

const productModel = mongoose.model('products', productSchema)
module.exports = productModel