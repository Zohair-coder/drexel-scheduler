import express from "express";
import coursesRouter from "./api/courses.js";

let app = express();

app.use(express.json());

app.use("/api/courses", coursesRouter);

app.get("/api/health", (req, res) => {
    res.send("OK");
});

let port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
let host = "localhost";
let protocol = "http";
app.listen(port, () => {
    console.log(`${protocol}://${host}:${port}`);
});
