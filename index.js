import express from "express";
import fetch from "node-fetch";
import https from "https";

// Setup proxy server
const app = express();
const port = 5050; // Set to 5050
const targetUrl = process.argv[2] || "https://performance.nymets.com";

// Create an HTTPS agent to manage HTTPS requests
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Accept self-signed certificates if needed, but use with caution in production
});

// Logger function in CLF format
function logRequest(req, res, statusCode) {
  if (req.method === "OPTIONS") {
    return;
  }
  const clfFormat = `[${new Date().toISOString()}] ${req.method} ${
    req.originalUrl
  } ${statusCode}`;
  console.log(clfFormat);
}

// Middleware to forward all requests to the target URL
app.use(async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
    res.setHeader("Access-Control-Allow-Methods", "*"); // Allow methods
    res.setHeader("Access-Control-Allow-Headers", "*"); // Allow headers
    const url = `${targetUrl}${req.originalUrl}`; // Construct the full target URL

    // Forward the request using fetch, including method, headers, body, and agent for HTTPS
    const response = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : null,
      agent: url.startsWith("https") ? httpsAgent : undefined, // Use HTTPS agent if target URL is HTTPS
    });

    // Forward the response from the target back to the client
    const data = await response.text(); // or use response.json() if required
    res.status(response.status).send(data);

    // Log request with response status code
    logRequest(req, res, response.status);
  } catch (error) {
    console.error("Error forwarding request:", error);
    res.status(500).send("Proxy Error");

    // Log request with error status code
    logRequest(req, res, 500);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Proxy server to ${targetUrl} listening on port ${port}`);
});
