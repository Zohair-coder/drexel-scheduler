import express from "express";
import Database from "../db.js";

const db = new Database();
let router = express.Router();

router.get("/", async (req, res) => {
  res.send("Hello World!");
});

router.post("/generateSchedules", async (req, res) => {
  console.log(req.body);
  let courses_input = req.body;

  if (!courses_input) {
    res.status(400).send("No courses provided");
  }

  if (courses_input.length === 0) {
    res.status(400).send("No courses provided");
  }

  let courses = [];
  for (let course of courses_input) {
    let [subject_code, course_number] = course.split(" ");
    let sections = await db.getSections(subject_code, course_number);
    courses.push(sections.rows);
  }
  //   TODO: Generate schedules
  res.send(courses);
});

export default router;
