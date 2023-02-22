import express from "express";
import Database from "../db.js";

const db = new Database();
let router = express.Router();

router.get("/", async (req, res) => {
  res.send("Hello World!");
});

router.post("/generateschedules", async (req, res) => {
  let courses_input: string[] = req.body.courses;

  if (!courses_input || courses_input.length === 0) {
    return res.status(400).json({ error: "No courses provided" });
  }

  let num_courses;
  if (req.body.num_courses) {
    if (Number.isInteger(req.body.num_courses)) {
      num_courses = parseInt(req.body.num_courses);
    } else {
      return res.status(400).json({ error: "Invalid number of courses" });
    }
  } else {
    num_courses = courses_input.length;
  }

  if (num_courses > courses_input.length) {
    return res.status(400).json({
      error:
        "Number of courses cannot be greater than number of courses provided",
    });
  }

  let courses = [];
  for (let course of courses_input) {
    let [subject_code, course_number] = course.split(" ");

    if (!subject_code || !course_number) {
      return res.status(400).json({ error: "Invalid course: " + course });
    }

    let sections = await db.getSections(subject_code, course_number);

    if (sections.rowCount === 0) {
      return res.status(404).json({ error: "No sections found for " + course });
    }

    courses.push(sections.rows);
  }
  let schedules = computeSchedules(courses, num_courses);

  let response: any[] = [];

  for (let schedule of schedules) {
    let hasFullSections = checkFullSections(schedule);
    let hasTimeConflict = checkTimeConflict(schedule);

    for (let section of schedule) {
      await add_instructors(section);
    }

    response.push({
      schedule,
      hasTimeConflict,
      hasFullSections,
    });
  }

  res.send(response);
});

function checkFullSections(schedule: any[]) {
  let hasFullSections = false;
  for (let section of schedule) {
    if (section.enroll === "FULL" || section.max_enroll === "FULL") {
      hasFullSections = true;
      break;
    }
  }
  return hasFullSections;
}

function checkTimeConflict(schedule: any[]) {
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      let section1 = schedule[i];
      let section2 = schedule[j];

      if (!section1.days || !section2.days) {
        continue;
      }

      if (intersection(section1.days, section2.days).length > 0) {
        if (
          !section1.start_time ||
          !section1.end_time ||
          !section2.start_time ||
          !section2.end_time
        ) {
          continue;
        }
        let start1 = getDateFromTime(section1.start_time);
        let end1 = getDateFromTime(section1.end_time);
        let start2 = getDateFromTime(section2.start_time);
        let end2 = getDateFromTime(section2.end_time);
        if (start1 < end2 && start2 < end1) {
          return true;
        }
      }
    }
  }

  return false;
}

function getDateFromTime(time: string) {
  let [hour, minute] = time.split(":");

  return new Date(0, 0, 0, parseInt(hour), parseInt(minute));
}

function computeSchedules(courses: any[][], n: number): any[][] {
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

function intersection(array1: any[], array2: any[]) {
  return array1.filter((value) => array2.includes(value));
}

async function add_instructors(section: any) {
  let crn = section.crn;
  let instructors = await db.getInstructors(crn);
  section.instructors = instructors;
}

export default router;
