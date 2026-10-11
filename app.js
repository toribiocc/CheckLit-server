const dns = require("node:dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRouter = require("./routes/auth");
const productsRouter = require("./routes/products");
const listsRouter = require("./routes/lists");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

// API root
app.get("/", (req, res) => {
  res.status(200).json({
    message: "CheckLit API is running!",
    status: "success",
  });
});

// MongoDB connection status
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.status(connected ? 200 : 503).json({
    server: "running",
    database: connected ? "connected" : "disconnected",
  });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/lists", listsRouter);

// Handle unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
    path: req.originalUrl,
  });
});

// Central error handler
app.use((error, req, res, next) => {
  console.error("API error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  if (
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    (error instanceof SyntaxError && error.status === 400)
  ) {
    return res.status(400).json({
      message: "Invalid request data.",
      error: error.message,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "A record with these details already exists.",
    });
  }

  res.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

// Start server after connecting to MongoDB
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from the .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
}

startServer();