const express = require("express");

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "nabaliw",
        status: "success",
    });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});