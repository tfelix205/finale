require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const userRouter = require('./routes/userRoutes');
const productRouter = require('./routes/product');
PORT = process.env.PORT || 6060;
const DB = process.env.DB

app.use(express.json());
app.use(express.urlencoded({extended: true}))


app.use('/api/v1', userRouter);
app.use('/api/v1', productRouter);




mongoose.connect(DB).then(()=>{
    console.log(`connected to database`);
    app.listen(PORT, ()=>{console.log(`server is running on port ${PORT}`);
    })
    

}).catch((error)=>{
    console.log(`cannot connect to database ${error.message}`)
    
})

