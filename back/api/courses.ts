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
  console.log(courses);
  let combinations = computeSectionCombinations(courses, courses.length);
  res.send(combinations);
});

function computeSectionCombinations(courses: any[][], n: number): any[][][] {
  const combinations: any[][][] = [];

  function backtrack(combo: any[][]): void {
    if (combo.length === n) {
      combinations.push(combo);
      return;
    }

    const i = combo.length;
    const course = courses[i];

    for (const section of course) {
      backtrack([...combo, section]);
    }
  }

  backtrack([]);

  return combinations;
}

export default router;
