const nodemailer = require("nodemailer");

// Create a transporter for SMTP
exports.sendMail = async ({to, subject, text, html}) => {
    try {
        const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.email,
    pass: process.env.pass,
  },
});

const info = await transporter.sendMail({
    from: process.env.email,
    to,
    subject,
    text,
    html
});

console.log(`message sent: ${info.messageId}`);

    } catch (error) {
        console.log(`Error sending mail ${error.message}`);
        throw error;
    }
};



