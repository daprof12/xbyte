const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  try {
    const { smtpConfig, recipients, subject, body } = req.body;

    if (!smtpConfig || !smtpConfig.host || !smtpConfig.port || !smtpConfig.username || !smtpConfig.password || !smtpConfig.fromEmail) {
      return res.status(400).json({ success: false, message: 'Invalid SMTP configuration' });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, message: 'No recipients provided' });
    }

    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.secure === true || parseInt(smtpConfig.port) === 465, // true for 465, false for other ports
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates for testing
      }
    });

    const results = [];
    const errors = [];

    // Send emails
    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: smtpConfig.fromName ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>` : smtpConfig.fromEmail,
          to: recipient.email,
          subject: subject,
          html: recipient.body || body, // Allow personalized body
        };

        const info = await transporter.sendMail(mailOptions);
        results.push({ email: recipient.email, messageId: info.messageId });
      } catch (err) {
        console.error(`Failed to send email to ${recipient.email}:`, err);
        errors.push({ email: recipient.email, error: err.message });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to send all emails', errors });
    }

    res.status(200).json({ 
      success: true, 
      message: `Sent ${results.length} emails successfully. Failed: ${errors.length}`,
      results,
      errors
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
