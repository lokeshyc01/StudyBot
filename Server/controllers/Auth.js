const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const Profile = require("../models/Profile");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
require("dotenv").config();
// send OTP
exports.sendOTP = async (req, res) => {
  try {
    // fetch email
    const { email } = req.body;

    // check if already exist
    const checkUserPresent = await User.findOne({ email });

    if (checkUserPresent) {
      return res
        .status(401)
        .json({ success: false, message: "user already regisered" });
    }

    // generate otp

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("generated otp=> ", otp);

    // make sure it is unique
    var result = OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };

    // insert unique otp in db

    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// signup

exports.signUp = async (req, res) => {
  try {
    // fetch data from body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;
    // validate

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All field are mandatory",
      });
    }

    // pass and confirm pass
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "password do not match with confirm password",
      });
    }
    // check user already exist

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "user already exist",
      });
    }

    // most recent otp
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log("recent otp ", recentOtp);

    if (recentOtp.length == 0) {
      return res.status(400).json({ success: false, message: "otp not found" });
    } else if (otp !== recentOtp) {
      return res
        .status(400)
        .json({ success: false, message: "otp not matching" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    return res.status(200).json({
      success: true,
      message: "User is registered",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered",
    });
  }
};

// login

exports.login = async (req, res) => {
  // fetch email and password

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(403).json({
        success: true,
        message: "email and password cannot be null",
      });
    }

    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "user is not registered , please signup first",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        role: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res
        .cookie("token", token, options)
        .status(200)
        .json({ success: true, user, message: "logged in" });
    } else {
      return res.status(401).json({
        success: false,
        message: "password in incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "login failure,please try again",
    });
  }
};

// changePassword

exports.changePassword = async (req, res) => {
  // fetch data from db
  const { email, oldPassword, newPassword, confirmNewPassword } = req.body;

  if (!email || !oldPassword || !newPassword || !confirmPassword) {
    return res.status(403).json({
      success: false,
      message: "all field are required",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "User is not registered" });
  }

  if (newPassword !== confirmNewPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passowrd should match" });
  }

  user.password = newPassword;

  await User.findByIdAndUpdate(user._id, { password: user.password });

  await mailSender(
    user.email,
    "Password Updated",
    `Hello ${user.firstName} Password updated successfully!!!`
  );
  return res.status(200).json({
    success: true,
    message: "Password Updated Successfully!!!",
  });
};
