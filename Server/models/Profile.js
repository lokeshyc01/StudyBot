const mongoose = require("mongoose")

const profileSchema = new mongoose.Schema({
    gender:{
        type:String,
        required:true
    },
    dateOfBirth:{
        type:Date,
        required:true
    },
    about:
    {
        type:String,
        trim:true,
    },
    contactNumber:
    {
        type:Number,
        trim:true,
    }
});

module.exports = mongoose.model("Profile",profileSchema);