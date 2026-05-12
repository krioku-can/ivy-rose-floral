export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.body;
  if (!address || address.trim().length < 5) {
    return res.status(400).json({ error: 'Address too short' });
  }

  try {
    // Geocode the delivery address using Nominatim (free, no API key)
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;
    const geoRes = await fetch(geoUrl, {
      headers: { 'User-Agent': 'IvyRoseFloral/1.0' }
    });
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      return res.status(200).json({ valid: false, reason: 'Address not found. Please enter a full street address.' });
    }

    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);

    // Origin: 2169 Elmo Ave, Hamilton, OH 45015 (hardcoded, never exposed)
    const originLat = 39.3754;
    const originLon = -84.5594;
    const maxMiles = 20;

    // Haversine distance
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat - originLat) * Math.PI / 180;
    const dLon = (lon - originLon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(originLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance > maxMiles) {
      return res.status(200).json({
        valid: false,
        reason: `We're sorry, delivery isn't available to that address (outside our delivery area). Please choose pickup instead!`,
        distance: Math.round(distance)
      });
    }

    return res.status(200).json({ valid: true, distance: Math.round(distance * 10) / 10 });
  } catch (err) {
    console.error('Geocoding error:', err.message);
    // On error, allow the order through — don't block on geocoding failure
    return res.status(200).json({ valid: true, distance: null, note: 'Could not verify distance' });
  }
};