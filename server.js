const express = require("express");
const app = express();

const usersRoutes = require("./routes/usersRoutes");
const attractionsRoutes = require("./routes/attractionsRoutes");
const logger = require("./middleware/logger");

app.use(express.json());
app.use(logger);

app.use("/users", usersRoutes);
app.use("/attractions", attractionsRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});