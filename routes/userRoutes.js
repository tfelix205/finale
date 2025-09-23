const { register,getOne, landing, getAll, verifyUser, login, home, forgetPassword, changePassword } = require('../controller/userController');
const uploads = require('../middleware/multer');
const router = require('express').Router();

router.get('/', landing)
router.post('/register',uploads.single('profilePicture'), register,)
router.get('/user/',getAll)
router.get('/user/:id',getOne)
router.get('/verify/:id', verifyUser)


router.post('/login',uploads.single(), login)
router.get('/home', home)
router.post('/password', forgetPassword)
router.get('/reset/:id/:token',changePassword)

module.exports = router;
