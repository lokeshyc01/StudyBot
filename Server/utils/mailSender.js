const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async(email,title,body) =>
{
    try
    {
        const transport = nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            auth:
            {
                user:MAIL_USER,
                pass:MAIL_PASS
            }
        });

       let info = await transport.sendMail({
            from:"StudyBot || Lokesh-Sujit Platform",
            to:email,
            subject:title,
            html:body,
        })
        console.log(info);
        return info;
    }
    catch(error)
    {
        console.log(error.message);
    }
}

module.exports = mailSender;

