const { register } = require('../controller/userController');
const uploads = require('../middleware/multer');
const router = require('express').Router();

router.post('/register',uploads.single('profilePicture'), register,)

module.exports = router;
