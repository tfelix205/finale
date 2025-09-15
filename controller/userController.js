const userModel = require('../model/userModel.js');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    try {
        const {fullName, email, password, age, phoneNumber} = req.body;
        const existEmail = await userModel.findOne({email: email.toLowerCase()});
        const existPhoneNumber = await userModel.findOne({phoneNumber: phoneNumber.toLowerCase()});

        if (existEmail || existPhoneNumber) {
            return res.status(400).json({
                message: `user already exist`
            })
        }

        const saltRound = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, saltRound);


        const user = new userModel({
            fullName,
            email,
            password: hashPassword,
            age,
            phoneNumber
        });

        res.status(201).json({
            message: `created successfully`,
            data: user
        })
        
    } catch (error) {
        res.status(500).json({
            message: `internal server error`,
            error: error.message
        })
    }
}