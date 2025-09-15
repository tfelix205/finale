const { register,getOne } = require('../controller/userController');
const uploads = require('../middleware/multer');
const router = require('express').Router();

router.post('/register',uploads.single('profilePicture'), register,)
router.get('/student/:id',getOne)

module.exports = router;
