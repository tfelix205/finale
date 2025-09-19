const { register,getOne, landing, getAll, verifyUser } = require('../controller/userController');
const uploads = require('../middleware/multer');
const router = require('express').Router();

router.get('/', landing)
router.post('/register',uploads.single('profilePicture'), register,)
router.get('/user/',getAll)
router.get('/user/:id',getOne)
router.get('/verify/:id', verifyUser)

module.exports = router;
