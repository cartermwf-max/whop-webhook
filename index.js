const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS
  }
});

async function sendEmail(subject, body) {
  await transporter.sendMail({
    from: GMAIL_USER,
    to: NOTIFY_EMAIL,
    subject,
    text: body
  });
}

app.post('/activate', async (req, res) => {
  console.log('Activate body:', JSON.stringify(req.body));
  const email = req.body?.email || req.body?.user?.email || req.body?.data?.user?.email || req.body?.text;
  if (!email) return res.status(400).send('No email');
  try {
    await sendEmail(
      'Whop: Add member tag',
      `A new member just subscribed on Whop.\n\nAdd the "whop-member" tag in Shopify for:\n\n${email}\n\nShopify link: https://midwestflyways.myshopify.com/admin/customers?query=${encodeURIComponent(email)}`
    );
    console.log('Email sent for activate:', email);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.post('/deactivate', async (req, res) => {
  console.log('Deactivate body:', JSON.stringify(req.body));
  const email = req.body?.email || req.body?.user?.email || req.body?.data?.user?.email || req.body?.text;
  if (!email) return res.status(400).send('No email');
  try {
    await sendEmail(
      'Whop: Remove member tag',
      `A member just unsubscribed on Whop.\n\nRemove the "whop-member" tag in Shopify for:\n\n${email}\n\nShopify link: https://midwestflyways.myshopify.com/admin/customers?query=${encodeURIComponent(email)}`
    );
    console.log('Email sent for deactivate:', email);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.get('/', (req, res) => res.send('Webhook server running'));

app.listen(3000, () => console.log('Running on port 3000'));
