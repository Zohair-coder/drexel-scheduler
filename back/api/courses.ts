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
    let sections = await db.getSections(subject_code, course_number);
    courses.push(sections.rows);
  }
  console.log(courses);
  //   TODO: fix computeSectionCombinations function.
  // Currently, it will return 6 instead of 11 combinations for the following input:
  // courses = [["A", "B", "C"], ["D", "E"], ["F"]]
  // num_courses = 2
  // Expected output: [["A", "D"], ["A", "E"], ["B", "D"], ["B", "E"], ["C", "D"], ["C", "E"], ["A", "F"], ["B", "F"], ["C", "F"], ["D", "F"], ["E", "F"]]
  //   Actual output: [["A", "D"], ["A", "E"], ["B", "D"], ["B", "E"], ["C", "D"], ["C", "E"]]
  let combinations = computeSectionCombinations(courses, num_courses);
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
