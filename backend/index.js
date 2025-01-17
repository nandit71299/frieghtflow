const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const routes = require("./routes");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", async (req, res) => {
  res.send("Wohoo!! It's Working...");
});

// Routes
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
