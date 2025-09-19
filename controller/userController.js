const userModel = require('../models/userModel.js');
const cloudinary = require('../config/cloudinary.js')
const bcrypt = require('bcrypt');
const {html} = require('../middleware/signUp.js')
const {sendMail} = require('../middleware/email.js')
const fs = require('fs');



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

exports.register = async (req, res) => {
    try {
        const {fullName, email, password, age, phoneNumber} = req.body;
        const file = req.file;
        
        
        let response;
        const existEmail = await userModel.findOne({email: email.toLowerCase()});
        const existPhoneNumber = await userModel.findOne({phoneNumber: phoneNumber.toLowerCase()});

        if (existEmail || existPhoneNumber) {
            fs.unlinkSync(file.path)
            return res.status(400).json({
                message: `user already exist`
            })
        }

        const saltRound = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, saltRound);

        if (file && file.path) {
            response = await cloudinary.uploader.upload(file.path);
            fs.unlinkSync(file.path)
        }


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

        
         await user.save()
        const subject = 'Kindly Verify Your email';
        const link  = `${req.protocol}://${req.get("host")}/api/v1/verify/${user._id}`
        // const text = `Hello from the other side ${fullName}, Welcome to our app!,  please click the link below to verify your Email ${link}`
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

exports.getOne = async (req,res)=>{
    try {
        const {id} = req.params
        console.log(id);
        
        const target = await userModel.findById(id)

        res.status(200).json({
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

exports.getAll = async (req, res) => {
    try {
        const users = await userModel.find();
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


exports.update = async (req, res) => {
    try {
        const {fullName, age} = req.body;
        const {id} = req.params;
        const file = req.file;
        let response;
        const user = await userModel.findById(id);

        if (!user) {
            fs.unlinkSync(file.path)
            return res.status(404).json(`user not found`)
        };

        if (file && file.path) {
            await cloudinary.uploader.destroy(user.profilePicture.publicId);
            fs.unlinkSync(file.path)
        }

        const userData = {
            fullName: fullName ?? user.fullName,
            age: age ?? user.age,
            profilePicture: {
                imageUrl: response?.secure_url,
                publicId: response?.public_id
            }
        };

        const newData = Object.assign(user, userData)
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
exports.verifyUser = async (req, res) => {
    try {
        const checkUser = await userModel.findById(req.params.id)
        if (!checkUser) {
           return res.status(400).json({
                message: `user not found`
            })
        }

        if (checkUser.isVerified) {
          return  res.status(400).json({
                message: `Email already verified`
            })
        }

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
}