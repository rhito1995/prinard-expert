require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer File Upload Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB File Limit
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const smtpConfigured = Boolean(
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  !process.env.SMTP_PASS.startsWith('YOUR_') &&
  process.env.ADMIN_EMAIL
);

// API Endpoint for Form Submissions
app.post('/api/submit-brief', upload.single('projectFile'), async (req, res) => {
  try {
    const { fullName, email, phone, service, brief } = req.body;
    const attachedFile = req.file;

    if (!fullName || !email || !service || !brief) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }

    if (!smtpConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Add a valid Gmail app password to the SMTP_PASS setting in .env.'
      });
    }

    const mailOptions = {
      from: `"PRINARD EXPERT Web Portal" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `New Project Brief: ${fullName} [${service}]`,
      text: `NEW PROJECT SUBMISSION - PRINARD EXPERT\n\n` +
            `Full Name: ${fullName}\n` +
            `Email Address: ${email}\n` +
            `Phone / WhatsApp: ${phone || 'Not provided'}\n` +
            `Service Required: ${service}\n\n` +
            `Project Requirements / Brief:\n${brief}\n\n` +
            `Attached File: ${attachedFile ? attachedFile.originalname : 'No file attached'}`,
      attachments: attachedFile ? [{ path: attachedFile.path, filename: attachedFile.originalname }] : []
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Your project brief has been submitted successfully. We will contact you shortly!'
    });

  } catch (error) {
    console.error('Server Submission Error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while transmitting your request. Please try again.'
    });
  }
});

// Start Server
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`PRINARD EXPERT Application running live on http://localhost:${PORT}`);
});