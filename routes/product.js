const { products, update } = require('../controller/product');
const uploads = require('../middleware/multer');

const router = require('express').Router();

router.post('/register', uploads.array('productImages', 5), products);
router.put('/products/:id', uploads.array('productImages', 5), update)

module.exports = router