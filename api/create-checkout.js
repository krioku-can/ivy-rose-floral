const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      size,
      name,
      phone,
      email,
      fulfillmentMethod,
      deliveryDay,
      deliveryTime,
      recipient,
      deliveryAddress,
      cardMessage,
      specialInstructions
    } = req.body;

    // Size-to-price mapping
    const pricing = {
      'Mini (5 Stems) - $15': { name: 'Mini Arrangement (5 Stems)', price: 1500 },
      'Small (8 Stems) - $25': { name: 'Small Arrangement (8 Stems)', price: 2500 },
      'Medium (17 Stems) - $50': { name: 'Medium Arrangement (17 Stems)', price: 5000 },
      'Large (27 Stems) - $75': { name: 'Large Arrangement (27 Stems)', price: 7500 },
      'X-Large (45 Stems) - $100': { name: 'X-Large Arrangement (45 Stems)', price: 10000 },
      "Designer's Choice - $85": { name: "Designer's Choice Arrangement", price: 8500 },
    };

    const item = pricing[size];
    if (!item) {
      return res.status(400).json({ error: 'Invalid size selection' });
    }

    // Build line items
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: 'Handcrafted arrangement by Ivy & Rose Floral Co.',
        },
        unit_amount: item.price,
      },
      quantity: 1,
    }];

    // Add delivery fee if delivery selected
    if (fulfillmentMethod === 'delivery') {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Delivery',
            description: 'Monday–Friday, 9 AM–Noon',
          },
          unit_amount: 1000, // $10
        },
        quantity: 1,
      });
    }

    // Build metadata with all order details
    const metadata = {
      customer_name: (name || '').substring(0, 500),
      customer_phone: (phone || '').substring(0, 500),
      fulfillment_method: fulfillmentMethod || 'pickup',
      delivery_day: (deliveryDay || '').substring(0, 500),
      delivery_time: (deliveryTime || '').substring(0, 500),
      recipient: (recipient || '').substring(0, 500),
      delivery_address: (deliveryAddress || '').substring(0, 500),
      card_message: (cardMessage || '').substring(0, 500),
      special_instructions: (specialInstructions || '').substring(0, 500),
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.BASE_URL || 'https://ivy-rose-evergreen-preview.vercel.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'https://ivy-rose-evergreen-preview.vercel.app'}/order.html`,
      customer_email: email || undefined,
      metadata,
      custom_text: {
        submit: {
          message: 'Ivy & Rose Floral Co. — Handcrafted arrangements in Hamilton, Ohio',
        },
      },
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};