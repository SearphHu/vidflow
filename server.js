const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Proxy
app.all("/api/proxy", async (req, res) => {
  const targetUrl = req.headers["x-target-url"] || req.query.url;
  const auth = req.headers["authorization"];
  if (!targetUrl) return res.status(400).json({ error: "Missing target URL" });
  try {
    const opts = { method: req.method, headers: {} };
    if (auth) opts.headers["Authorization"] = auth;
    if (req.method === "POST") {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(req.body);
    }
    const resp = await fetch(targetUrl, opts);
    const data = await resp.json();
    res.json(data);
  } catch(e) {
    res.status(502).json({ error: e.message });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log("Server on http://localhost:" + PORT));
