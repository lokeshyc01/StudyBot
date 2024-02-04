const mongoose = require("mongoose");
require("dotenv").config();


exports.connect = () =>{
    mongoose.connect(process.env.MONGODB_URL,{
        useNewUrlParser : true,
        useUnifiedTopology : true,
    })
    .then(() =>{console.log("db connected")})
    .catch((error)=> {
        console.log("error in connection");
        console.log(error);
        process.exit(1);
    })
}