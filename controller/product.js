const productModel = require('../models/product')
const cloudinary = require('../config/cloudinary');
const fs = require('fs');


exports.products = async (req, res) => {
    try {
        const {productName} = req.body;
        const files = req.files;
        let response;
        let list =[];
        let babyList = {};

        
    } catch (error) {
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        }) 
    }
};


exports.update = async (req, res) => {
    try {
        const {productName} = req.body;
        const {id} = req.params;
        const products = await productModel.findById(id);
        const files = req.files;
        let response;
        let list = [];
        let babyList = {}

        if (!products) {
            return res.status(404).json(`product not found`)
        };

        if(files && files.length > 0) {
            for (const product of products.productImages) {
                await cloudinary.uploader.destroy(product.publicId)
            };
            for (const file of files) {
            response = await cloudinary.uploader.upload(file.path);
            babyList = {
                publicId: response.public_id,
                imageUrl: response.secure_url
            };
            list.push(babyList);
            fs.unlinkSync(file.path);

            }

        }
        const data = {
            productName: productName ?? products.productName,
            productImages: list
        };
        const update = await productModel.findByIdAndUpdate(product._d, data, {new: true});

        res.status(200).json({
            message: `product successfully updated`,
            data: update
        })
        
    } catch (error) {
         res.status(500).json({
            message: `internal server error`,
            error: error.message
        }) 
    }
}
