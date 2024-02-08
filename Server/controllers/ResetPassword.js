const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
exports.resetPasswordToken = async (req, res) => {
  try {
    // get email
    const { email } = req.body;
    // check if user exist
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: false,
        message: "email is not registered",
      });
    }
    // generate token
    const token = crypto.randomUUID();

    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );
    const url = `http://localhost:3000/update-password/${token}`;
    await mailSender(email, "Password reset Link", url);

    return res.json({
      success: true,
      message: "email sent successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "something went wrong while rese link",
    });
  }
};

// reset password

exports.resetPassword = async (req, res) => {
try
{
    const {password,confirmPassword,token} = req.body;

    if(password !== confirmPassword)
    {
        return res.json({
            success:false,
            message:"Password not matching",
        })
    }

    const userDetails = await User.findOne({token:token});
    
    if(!userDetails)
    {
        return res.json({
            success:false,
            message:"Token is invalid"
        })
    }

    if(userDetails.resetPasswordExpires < Date.now())
    {
        return res.json({
            success:false,
            message:"Token is expired , regenerate it",
        })
    }

    const hashedPassword = await bcrypt.hash(password,10);

    await User.findOneAndUpdate({token:token},{password:hashedPassword},{new:true});
}
catch(error)
{
    console.log(error);
    return res.status(500).json({
        success:false,
        message:"something went wrong while reseting password"
    })
}

};
