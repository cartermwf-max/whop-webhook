const express = require('express');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  console.log('Raw body:', JSON.stringify(req.body));
  next();
});

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

async function sendEmail(subject, body) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Whop Webhook <onboarding@resend.dev>',
      to: NOTIFY_EMAIL,
      subject,
      text: body
    })
  });
  const data = await res.json();
  console.log('Resend response:', JSON.stringify(data));
}

app.post('/activate', async (req, res) => {
  console.log('Activate headers:', JSON.stringify(req.headers));
  console.log('Activate body:', JSON.stringify(req.body));
  const email = req.body?.email || req.body?.user?.email || req.body?.data?.user?.email || req.body?.text;
  if (!email) return res.status(400).send('No email');
  try {
    await sendEmail(
      'Whop: Add member tag',
      `A new member just subscribed on Whop.\n\nAdd the "whop-member" tag in Shopify for:\n\n${email}\n\nShopify link: https://midwestflyways.myshopify.com/admin/customers?query=${encodeURIComponent(email)}`
    );
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
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.get('/', (req, res) => res.send('Webhook server running'));

app.listen(3000, () => console.log('Running on port 3000'));
