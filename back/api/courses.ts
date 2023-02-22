import express from "express";
import Database from "../db.js";

const db = new Database();
let router = express.Router();

router.get("/", async (req, res) => {
  res.send("Hello World!");
});

router.post("/generateSchedules", async (req, res) => {
  console.log(req.body);
  let courses_input = req.body.courses;
  let num_courses = req.body.num_courses;

  if (!courses_input) {
    res.status(400).send("No courses provided");
  }

  if (courses_input.length === 0) {
    res.status(400).send("No courses provided");
  }

  let courses = [];
  for (let course of courses_input) {
    let [subject_code, course_number] = course.split(" ");

    if (!subject_code || !course_number) {
      return res.status(400).send("Invalid course " + course);
    }

    let sections = await db.getSections(subject_code, course_number);

    if (sections.rowCount === 0) {
      return res.status(404).send("No sections found for " + course);
    }

    courses.push(sections.rows);
  }
  console.log(courses);
  let combinations = computeSectionCombinations(courses, num_courses);

  let response: any[] = [];
  for (let combination of combinations) {
    response.push({
      courses: combination,
      hasTimeConflict: false, // TODO: Implement this
      isFull: false, // TODO: Implement this
    });
  }

  res.send(response);
});

function computeSectionCombinations(courses: any[][], n: number): any[][] {
  const combinations: any[][] = [];

  function backtrack(combo: any[][], i: number): void {
    if (combo.length === n) {
      combinations.push(combo);
      return;
    }

    if (i >= courses.length) {
      return;
    }

    const course = courses[i];

    for (const section of course) {
      backtrack([...combo, section], i + 1);
    }

    backtrack(combo, i + 1);
  }

  backtrack([], 0);

  return combinations;
}

export default router;
