const nodemailer = require("nodemailer");

nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error("Failed to create a testing account. " + err.message);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: false,
        auth: {
            user: account.user,
            pass: account.pass
        }
    });

    transporter
        .sendMail({
            from: "Example app <no-reply@example.com>",
            to: "user@example.com",
            subject: "Hello from tests ✔",
            text: "This message was sent from a Node.js integration test.",
        })
        .then((info) => {
            console.log("Message sent: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        })
        .catch(console.error);
});