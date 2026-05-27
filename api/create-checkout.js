const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Haversine distance in miles
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Origin coordinates (2169 Elmo Ave, Hamilton, OH 45015 — never exposed to user)
const ORIGIN_LAT = 39.3754;
const ORIGIN_LON = -84.5594;
const MAX_DELIVERY_MILES = 20;

async function sendOrderNotification(orderDetails) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('Email not configured — set SENDGRID_API_KEY');
    return;
  }

  const { itemName, totalCents, fulfillmentMethod, name, phone, email,
          pickupDate, pickupTime, deliveryDay, deliveryTime, recipient,
          deliveryAddress, cardMessage, specialInstructions, methodLabel } = orderDetails;

  const totalFormatted = '$' + (totalCents / 100).toFixed(2);
  const emailBody = [
    '🌸 New Ivy & Rose Order!',
    '',
    `Size: ${itemName}`,
    `Total: ${totalFormatted}`,
    '',
    `Customer: ${name || 'Unknown'}`,
    `Phone: ${phone || 'Not provided'}`,
    `Email: ${email || 'Not provided'}`,
    '',
    methodLabel,
    ...(fulfillmentMethod === 'delivery' ? [
      `Recipient: ${recipient || 'N/A'}`,
      `Address: ${deliveryAddress || 'N/A'}`,
    ] : []),
    '',
    `Card Message: ${cardMessage || 'None'}`,
    `Special Instructions: ${specialInstructions || 'None'}`,
    '',
    'View in Stripe: https://dashboard.stripe.com/payments',
  ].join('\n');

  try {
    await sgMail.send({
      to: process.env.NOTIFY_EMAIL || 'ivyrosefloralco@gmail.com',
      from: {
        email: 'noreply@ivyrosefloralco.com',
        name: 'Ivy & Rose Orders',
      },
      subject: `🌸 New Order — ${itemName} — ${totalFormatted}`,
      text: emailBody,
    });
    console.log('Order notification sent via SendGrid');
  } catch (err) {
    console.error('Failed to send order notification:', err.message);
  }
}

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
      pickupDate,
      pickupTime,
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

    // Server-side delivery distance verification
    if (fulfillmentMethod === 'delivery' && deliveryAddress) {
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(deliveryAddress)}&format=json&limit=1&countrycodes=us`;
        const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'IvyRoseFloral/1.0' } });
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lon = parseFloat(geoData[0].lon);
          const distance = haversine(ORIGIN_LAT, ORIGIN_LON, lat, lon);
          if (distance > MAX_DELIVERY_MILES) {
            return res.status(400).json({
              error: 'Your delivery address is outside our delivery area (20 miles from Hamilton). Please choose pickup instead.'
            });
          }
        }
      } catch (geoErr) {
        console.error('Server-side geocoding failed (allowing order through):', geoErr.message);
      }
    }

    // Build fulfillment description for Stripe line item
    let fulfillmentDesc = '';
    if (fulfillmentMethod === 'pickup' && pickupDate && pickupTime) {
      const dateObj = new Date(pickupDate + 'T12:00:00');
      const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      fulfillmentDesc = `Pickup on ${formatted}, ${pickupTime}`;
    } else if (fulfillmentMethod === 'delivery' && deliveryDay && deliveryTime) {
      fulfillmentDesc = `Delivery on ${deliveryDay}, ${deliveryTime}`;
    } else if (fulfillmentMethod === 'pickup') {
      fulfillmentDesc = 'Pickup — date/time TBD';
    } else {
      fulfillmentDesc = 'Delivery — date/time TBD';
    }

    // Build line items
    const lineItems = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: fulfillmentDesc,
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
            description: deliveryDay && deliveryTime ? `${deliveryDay}, ${deliveryTime}` : 'Monday–Friday, 9 AM–Noon',
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
      pickup_date: (pickupDate || '').substring(0, 500),
      pickup_time: (pickupTime || '').substring(0, 500),
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
      success_url: `${process.env.BASE_URL || 'https://ivyrosefloralco.com'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL || 'https://ivyrosefloralco.com'}/order.html`,
      customer_email: email || undefined,
      metadata,
      custom_text: {
        submit: {
          message: 'Ivy & Rose Floral Co. — Handcrafted arrangements in Hamilton, Ohio',
        },
      },
    });

    // Send Chey a notification email (non-blocking)
    const totalCents = item.price + (fulfillmentMethod === 'delivery' ? 1000 : 0);
    const methodLabel = fulfillmentMethod === 'pickup'
      ? `Pickup: ${pickupDate || 'TBD'} at ${pickupTime || 'TBD'}`
      : `Delivery: ${deliveryDay || 'TBD'}, ${deliveryTime || 'TBD'}`;

    // Fire and forget — don't block the response on email
    sendOrderNotification({
      itemName: item.name,
      totalCents,
      fulfillmentMethod,
      name,
      phone,
      email,
      pickupDate,
      pickupTime,
      deliveryDay,
      deliveryTime,
      recipient,
      deliveryAddress,
      cardMessage,
      specialInstructions,
      methodLabel,
    });

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};
