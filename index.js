const express = require("express");
const app = express();
const dbConnection = require("./config/db");

const PORT = process.env.PORT || 3000;

dbConnection();

app.use(express.json({ extended: false }));

app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));

app.get("/", (req, res) => {
  res.send("OKAY BOBBY");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
