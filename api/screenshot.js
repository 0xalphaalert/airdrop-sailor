export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Grab your hidden API key from Vercel's secure environment variables
  const BROWSERLESS_TOKEN = process.env.BROWSERLESS_API_KEY;

  if (!BROWSERLESS_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  try {
    // We make the request to Browserless FROM the secure backend, bypassing CORS
    const response = await fetch(`https://chrome.browserless.io/screenshot?token=${BROWSERLESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body) // Pass the HTML and options from the frontend
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserless API Error: ${errorText}`);
    }

    // Send the image back to your frontend
    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error("Backend Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}