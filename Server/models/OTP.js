const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 60 * 5, //document preserved for 5 min
	},
});


async function sendVerificationEmail(email, otp) {
	
	try {
		const mailResponse = await mailSender(
			email,
			"Verification Email from StudyBot",
			emailTemplate(otp)
		);
		console.log("Email sent successfully: ", mailResponse.response);
	} catch (error) {
		console.log("Error occurred while sending email: ", error);
		throw error;
	}
}

// pre-save hook to send email
OTPSchema.pre("save",async function(next){
	console.log("new document created");

	// sending email only if it is new
	if(this.isNew)
	{
		await sendVerificationEmail(this.email,this.otp);
	}
	next();
})

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;