const express = require('express');
const app = express();

app.use(express.json());

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

async function getCustomer(email) {
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/customers/search.json?query=email:${email}`,
    { headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN } }
  );
  const data = await res.json();
  return data.customers?.[0] || null;
}

async function createCustomer(email) {
  await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/customers.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: {
          email,
          tags: 'whop-member',
          send_email_invite: true
        }
      })
    }
  );
}

async function updateTags(customer, add) {
  let tags = customer.tags.split(',').map(t => t.trim()).filter(Boolean);
  if (add) {
    if (!tags.includes('whop-member')) tags.push('whop-member');
  } else {
    tags = tags.filter(t => t !== 'whop-member');
  }
  await fetch(
    `https://${SHOPIFY_STORE}/admin/api/2024-01/customers/${customer.id}.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customer: { id: customer.id, tags: tags.join(', ') } })
    }
  );
}

app.post('/activate', async (req, res) => {
  const email = req.body?.email || req.body?.user?.email || req.body?.data?.user?.email;
  if (!email) return res.status(400).send('No email');
  try {
    const customer = await getCustomer(email);
    if (customer) {
      await updateTags(customer, true);
    } else {
      await createCustomer(email);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.post('/deactivate', async (req, res) => {
  const email = req.body?.email || req.body?.user?.email || req.body?.data?.user?.email;
  if (!email) return res.status(400).send('No email');
  try {
    const customer = await getCustomer(email);
    if (customer) await updateTags(customer, false);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.get('/', (req, res) => res.send('Webhook server running'));

app.listen(3000, () => console.log('Running on port 3000'));
