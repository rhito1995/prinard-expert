const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const allowedServices = new Set([
  'Research Support',
  'Data & Econometrics',
  'Strategic Consultancy',
]);

function sanitizeText(value) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ------------------------------
// Middleware
// ------------------------------
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Serve the frontend from the project root
app.use(express.static(__dirname));

// Basic rate limiting on the contact endpoint to prevent abuse
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// ------------------------------
// Mailer setup
// ------------------------------
function buildTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

const transporter = buildTransporter();
const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_TO || process.env.SMTP_USER || process.env.EMAIL_USER;
const emailConfigured = Boolean(transporter && adminEmail);

// ------------------------------
// Routes
// ------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    emailConfigured,
    timestamp: new Date().toISOString(),
  });
});

// Contact form submission
app.post('/api/contact', contactLimiter, upload.single('file'), async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name);
    const email = sanitizeText(req.body?.email).toLowerCase();
    const phone = sanitizeText(req.body?.phone);
    const service = sanitizeText(req.body?.service);
    const message = sanitizeText(req.body?.message);

    if (!name || !email || !service || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, service, and message are required.',
      });
    }

    if (!allowedServices.has(service)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid service option.',
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (phone && !/^[-+()\d\s]{7,20}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number.',
      });
    }

    if (!emailConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Add SMTP_USER, SMTP_PASS, and ADMIN_EMAIL in Render.',
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeService = escapeHtml(service);
    const safePhone = escapeHtml(phone || 'N/A');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    await transporter.sendMail({
      from: `"${safeName}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      replyTo: email,
      to: adminEmail,
      subject: `New contact form message from ${safeName}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nService: ${service}\nAttachment: ${req.file?.originalname || 'None'}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>Service:</strong> ${safeService}</p>
        <p><strong>Attachment:</strong> ${escapeHtml(req.file?.originalname || 'None')}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
      attachments: req.file
        ? [{ filename: req.file.originalname, content: req.file.buffer, contentType: req.file.mimetype }]
        : [],
    });

    res.json({ success: true, message: 'Thank you! Your message has been sent.' });
  } catch (err) {
    console.error('Error handling contact form submission:', err);
    res.status(500).json({
      success: false,
      message: getMailErrorMessage(err),
    });
  }
});

function getMailErrorMessage(error) {
  const code = String(error?.code || '').toUpperCase();
  const response = String(error?.response || '');

  if (code.includes('EAUTH') || response.includes('535')) {
    return 'SMTP authentication failed. Check the Gmail address and App Password in Render.';
  }
  if (code.includes('ETIMEDOUT') || code.includes('ECONNREFUSED') || code.includes('ESOCKET')) {
    return 'SMTP connection failed. Check the SMTP host and port in Render.';
  }
  return 'Email delivery failed. Check the Render service logs and SMTP settings.';
}

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'The attached file exceeds the 10MB limit.'
      : 'The attached file could not be processed.';
    return res.status(400).json({ success: false, message });
  }

  console.error('Unhandled request error:', error);
  return res.status(500).json({
    success: false,
    message: 'The request could not be processed. Please try again.',
  });
});

// Fallback: serve index.html for any other GET route (simple SPA-style fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ------------------------------
// Start server
// ------------------------------
app.listen(PORT, () => {
  console.log(`Prinard Expert server running at http://localhost:${PORT}`);
});