// import dependecies, modules and functions
const userModel = require('../models/userModel.js');
const cloudinary = require('../config/cloudinary.js')
const bcrypt = require('bcrypt');
const {html} = require('../middleware/signUp.js')
const {forgotHtml} = require('../middleware/forgotPass.js')
const {sendMail} = require('../middleware/email.js')
const fs = require('fs');
const jwt = require('jsonwebtoken');


// fuction for the landing page
exports.landing = async (req, res) => {
    try {
        res.status(200).json({
            message: `WELCOME TO BACKEND`
        })
    } catch (error) {
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        })
    }
}


// funstion to register a user
exports.register = async (req, res) => {
    try {
        // extrct required field from the request body
        const {fullName, email, password, age, phoneNumber} = req.body;
        const file = req.file;
        
        
        let response;
        //check the database for for any of the existing fields to avoid duplicates
        const existEmail = await userModel.findOne({email: email.toLowerCase()});
        const existPhoneNumber = await userModel.findOne({phoneNumber: phoneNumber.toLowerCase()});

        if (existEmail || existPhoneNumber) {
            fs.unlinkSync(file.path)
            return res.status(400).json({
                message: `user already exist`
            })
        }

            //generate saltrounds for the password
        const saltRound = await bcrypt.genSalt(10);
        //hash the password with the saltrounds
        const hashPassword = await bcrypt.hash(password, saltRound);

        //checking for file availability
        if (file && file.path) {
            //uploading the file to cloudinary
            response = await cloudinary.uploader.upload(file.path);
            //deleting the file from local storage
            fs.unlinkSync(file.path)
        }

        // creating a new user 
        const user = new userModel({
            fullName,
            email,
            password: hashPassword,
            age,
            phoneNumber,
            profilePicture:{
                imageUrl: response.secure_url,
                publicId: response.public_id

            }
        });

        // awaits the collection of data of the user then saves it to the database
         await user.save()
        const subject = 'Kindly Verify Your email';
        const link  = `${req.protocol}://${req.get("host")}/api/v1/verify/${user._id}`
        // const text = `Hello from the other side ${fullName}, Welcome to our app!,  please click the link below to verify your Email ${link}`

        // sending a mail to the newly created user for verification
       await sendMail({
           to: email, 
           subject, 
        //    text, 
           html:html(link, user.fullName)
        })

        res.status(201).json({
            message: `created successfully`,
            data: user
        })
        
    } catch (error) {
        console.log(error);
        
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        })
    }
}
// geting the data of one user
exports.getOne = async (req,res)=>{
    try {
        //extract the id from the params
        const {id} = req.params
        console.log(id);
        // using the id to search for the user in the database
        const target = await userModel.findById(id)
        // resturn response if user if found or not
        if(!target) {
            return res.status(404).json(`user with ${id} not found`)
        }

       return res.status(200).json({
            message:"found",
            data: target
        })


    } catch (error) {
        res.status(500).json({
            message:"internal server error",
            error:error.message
        })
    }
};


//get all user
exports.getAll = async (req, res) => {
    try {
        //search for all the users in the database
        const users = await userModel.find();
        //checking if there's any user and return a response
        if (users.length < 1) {
            return res.status(200).json({
                message: `No Users Found !`,
                users
            })
        }
        res.status(200).json({
            message: `All Users`,
            users
        })
    } catch (error) {
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        })
    }
};

// update a user data
exports.update = async (req, res) => {
    try {
        // extrating required fields for updates from request body
        const {fullName, age} = req.body;
        //extracting the user id to be updated
        const {id} = req.params;
        const file = req.file;
        let response;
        // finding the user with their id
        const user = await userModel.findById(id);
        //checking if the user exist in the database
        if (!user) {
            //undoing the file upload process if there's any
            fs.unlinkSync(file.path)
            return res.status(404).json(`user not found`)
        };
        // completing the file upload if user exist
        if (file && file.path) {
            await cloudinary.uploader.destroy(user.profilePicture.publicId);
            fs.unlinkSync(file.path)
        }

        //pass the update instance into an object
        const userData = {
            fullName: fullName ?? user.fullName,
            age: age ?? user.age,
            profilePicture: {
                imageUrl: response?.secure_url,
                publicId: response?.public_id
            }
        };

        // using obect.assign to pass the update into user object and replacing fields that already exists
        const newData = Object.assign(user, userData)
        //updating the databse with the updated object
        const update = await userModel.findByIdAndUpdate(user._id, newData, {new: true});

        res.status(200).json({
            message:`user updated sucessfully`,
            data: update
        })
    } catch (error) {
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        })
    }
};


//verifying user 
exports.verifyUser = async (req, res) => {
    try {
        //checking if the user exist using the id from the params
        const checkUser = await userModel.findById(req.params.id)
        if (!checkUser) {
           return res.status(400).json({
                message: `user not found`
            })
        }

        //checking if user has already been verified using isVerifed status
        if (checkUser.isVerified) {
          return  res.status(400).json({
                message: `Email already verified`
            })
        }
        // verifying the user by updating their isVerified status
        await userModel.findByIdAndUpdate(req.params.id, {isVerified: true}, {new: true})
        res.status(200).json({
            messge: `Email successfully Verified`
        })
        
    } catch (error) {
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        })
    }
};

// login function
exports.login = async (req, res) => {
    try {
        //extracting login requirement from the request body
        const {email, password} = req.body;
        //checking if there's a user with the supplied email
        const checkUser = await userModel.findOne({email:email.toLowerCase().trim()})
        //comparing the password with the hashed password in the database
        const checkPassword = await bcrypt.compare(password, checkUser.password)

        //checking credentials validity
        if (!checkUser || !checkPassword) {
            return res.status(400).json(`invalid credentials`)
        }

        //generate a token for the user
        const token = jwt.sign({id:checkUser._id}, "otolo", {expiresIn: "1m"})

       res.status(200).json({
        message: `Login successful`,
        data: checkUser,
        token
       })
        
    } catch (error) {
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        }) 
    }
};

// user dashboard function
exports.home = async (req, res) => {
    try {
        //passing the supplied token to a variable 
        const checkToken = req.headers.authorization
        //sendinf a response if token is not supplied 
        if (!checkToken){
            return res.status(400).json(`login required`)
        }
        //validating token to get the required data only
        const token = req.headers.authorization.split(" ")[1]
        //verifying token
        jwt.verify(token, "otolo", async (err, result) => {
            if (err){
                return res.status(400).json({error:err.message})
            } else {
                //returning a response once verification is passed
                const checkUser = await userModel.findById(result.id)
                res.status(200).json(`Welcome ${checkUser.fullName}, we are happy to have you here`)
            }
        })
        
    } catch (error) {
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        }) 
    }
};


// forgot password function
exports.forgetPassword = async (req, res) => {
    try {
        //extracting email from request body
        const {email} = req.body
        //checking email for validity
        const checkemail = await userModel.findOne({email:email.toLowerCase().trim()})
        if (!checkemail){
            res.status(404).json(`invalid email provided`)
        }
        const subject = `Reset password`

        //creating a token
        const token = jwt.sign({id:checkemail._id}, "suliya", {expiresIn: "2m"})
        checkemail.token = token

        // creating a reset link to me sent to user
        const link = `${req.protocol}://${req.get("host")}/api/v1/reset/${checkemail.token}`
        //sending the reset link to the user email
        await sendMail({
            to:email,
            subject,
             html: forgotHtml(link, checkemail.fullName)

        })

        res.status(200).json({
            message: `Kindly check your email for instruction`
        })
    } catch (error) {
      res.status(500).json({
            message: `internal server error`,
            error: error.message
        })    
    }
};

// changing user password
exports.changePassword = async (req, res) => {
    try {
        //extracting new password from request  body
        const {newPassword, confrimPassword} = req.body
        //reconfirming password
        if (newPassword !== confrimPassword){
            return res.status(400).json(`password does not match`)
        }
        //generating salt for new password
        const salt = await bcrypt.genSalt(10)
        // hashing new password
        const hash = await bcrypt.hash(confrimPassword, salt)
        
        //finding user to be reset
        const user = await userModel.findById(req.params.id)
        //verifying user token
        jwt.verify(user.token, "suliya", async (err, result)=>{
            if(err){
                return res.status(400).json(`expired reset link`)
            } else{
                //updating user password once token is verified
                await userModel.findByIdAndUpdate(result.id, {password:hash, token:null}, {new:true})

                res.status(200).json(`password successfully changed`)

            }
        } )
    } catch (error) {
         res.status(500).json({
            message: `internal server error`,
            error: error.message
        })    
    }
}