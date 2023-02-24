import express from "express";
import coursesRouter from "./api/courses.js";

let app = express();

app.use(express.json());

app.use("/api/courses", coursesRouter);

app.get("/health", (req, res) => {
    res.send("OK");
});

let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
