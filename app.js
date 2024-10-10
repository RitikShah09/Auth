const express = require("express");
const app = express();
require("dotenv").config();

require("./models/db.js").connectDB();

app.use(express.json());

app.use("/auth", require("./routes/userRoutes.js"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
