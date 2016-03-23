const nodemailer = require('nodemailer');
const logarithmic = require("logarithmic");

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(`smtps://${process.env.GMAIL_USERNAME || "hackatmhs%40gmail.com"}:${process.env.GMAIL_PASSWORD}@smtp.gmail.com`);

module.exports = (to, subject, text, fromName = "Abhinav Madahar") => {
    const mailOptions = {
        from: `"${fromName} 👥" <hackatmhs@gmail.com>`,
        to,
        subject,
        text
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            logarithmic.warning(error);
            return;
        }
        logarithmic.ok('Message sent: ' + info.response);
    });
}
