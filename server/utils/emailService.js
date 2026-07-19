const nodemailer = require('nodemailer')

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
})

exports.sendNotificationEmail = async (emails, subject, text, html) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials missing. Skipping email notification.')
    return
  }
  
  if (!emails || emails.length === 0) return

  try {
    const mailOptions = {
      from: `"Chintu-Mintu Gang" <${process.env.SMTP_USER}>`,
      to: emails.join(','),
      subject,
      text,
      html
    }
    await transporter.sendMail(mailOptions)
  } catch (err) {
    console.error('Error sending email:', err)
  }
}
