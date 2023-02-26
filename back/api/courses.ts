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
            error: "Number of courses cannot be greater than number of courses provided",
        });
    }

    courses_input = [...new Set(courses_input)];

    let courses = [];
    for (let course of courses_input) {
        let [subject_code, course_number] = course.split(" ");

        if (!subject_code || !course_number) {
            return res.status(400).json({ error: "Invalid course: " + course });
        }

        let sections = await db.getSections(subject_code, course_number);

        if (sections.rowCount === 0) {
            return res
                .status(404)
                .json({ error: "No sections found for " + course });
        }

        let sections_by_instruction_types: any = {};
        for (let section of sections.rows) {
            if (!sections_by_instruction_types[section.instruction_type]) {
                sections_by_instruction_types[section.instruction_type] = [];
            }
            sections_by_instruction_types[section.instruction_type].push(
                section
            );
        }

        let course_units = computeCourseUnits(
            Object.values(sections_by_instruction_types)
        );

        courses.push(course_units);
    }

    console.log("Computing schedules...");
    let schedules = computeSchedules(courses, num_courses);
    console.log(
        "Done computing schedules - " + schedules.length + " schedules"
    );

    let schedulesResponse: any[] = [];

    console.log("Adding instructor ids...");
    for (let schedule of schedules) {
        for (let course of schedule) {
            for (let section of course) {
                await add_instructor_ids(section);
            }
        }
    }
    console.log("Done adding instructor ids");

    console.log("Getting instructors...");
    const instructors = await getAllInstructors(schedules);
    console.log("Done getting instructors");

    console.log("Adding other info...");
    for (let schedule of schedules) {
        let hasFullSections = checkFullSections(schedule);

        let avgScheduleRating = getAvereageScheduleRating(
            schedule,
            instructors
        );

        let earliestClassTime = getEarliestClassTime(schedule);

        let latestClassTime = getLatestClassTime(schedule);

        schedulesResponse.push({
            hasFullSections,
            avgScheduleRating,
            earliestClassTime,
            latestClassTime,
            schedule,
        });
    }

    console.log("Done adding other info");

    res.send({
        totalSchedules: schedulesResponse.length,
        schedules: schedulesResponse,
        instructors,
    });
});

function checkFullSections(schedule: any[]) {
    let hasFullSections = false;
    for (let course of schedule) {
        for (let section of course) {
            if (section.enroll === "FULL" || section.max_enroll === "FULL") {
                hasFullSections = true;
                break;
            }
        }
    }
    return hasFullSections;
}

function checkTimeConflict(schedule: any[][]) {
    for (let i = 0; i < schedule.length; i++) {
        for (let j = i; j < schedule.length; j++) {
            let course1 = schedule[i];
            let course2 = schedule[j];

            for (let section1 of course1) {
                for (let section2 of course2) {
                    if (section1 === section2) {
                        continue;
                    }

                    if (!section1.days || !section2.days) {
                        continue;
                    }

                    if (intersection(section1.days, section2.days).length > 0) {
                        if (
                            section1.start_time &&
                            section1.end_time &&
                            section2.start_time &&
                            section2.end_time
                        ) {
                            if (checkTimeConflictHelper(section1, section2)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

function checkTimeConflictHelper(section1: any, section2: any) {
    let start_time1 = getDateFromTime(section1.start_time);
    let end_time1 = getDateFromTime(section1.end_time);
    let start_time2 = getDateFromTime(section2.start_time);
    let end_time2 = getDateFromTime(section2.end_time);

    if (start_time1 < end_time2 && start_time2 < end_time1) {
        return true;
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
            if (!checkTimeConflict(combo)) {
                console.log(combo);
                combinations.push(combo.slice());
            }
            return;
        }

        // cap at 1000 schedules to avoid long wait times
        // and out of memory errors
        // if (combinations.length >= 1000) {
        //     return;
        // }

        if (i >= courses.length) {
            return;
        }

        const course = courses[i];

        for (const section of course) {
            combo.push(section);
            backtrack(combo, i + 1);
            combo.pop();
        }

        backtrack(combo, i + 1);
    }

    backtrack([], 0);

    return combinations;
}

function intersection(array1: any[], array2: any[]) {
    return array1.filter((value) => array2.includes(value));
}

async function add_instructor_ids(section: any) {
    let crn = section.crn;
    let instructors = await db.getInstructors(crn);

    let instructor_ids = [];

    for (let instructor of instructors) {
        instructor_ids.push(instructor.id);
    }

    section.instructors = instructor_ids;
}

function getAverageScheduleStartAndEndTime(schedule: any[]) {
    let total_start_time = 0;
    let total_end_time = 0;
    let num_sections = 0;

    for (let course of schedule) {
        for (let section of course) {
            if (section.start_time && section.end_time) {
                total_start_time += getDateFromTime(
                    section.start_time
                ).getTime();
                total_end_time += getDateFromTime(section.end_time).getTime();
                num_sections++;
            }
        }
    }

    if (num_sections === 0) {
        return;
    }

    let avg_start_time = total_start_time / num_sections;
    let avg_end_time = total_end_time / num_sections;

    let start_date = new Date(avg_start_time);
    let end_date = new Date(avg_end_time);

    return [
        new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
        }).format(start_date),
        new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
        }).format(end_date),
    ];
}

function getAvereageScheduleRating(schedule: any[], instructors: any) {
    let total_avg_rating = 0;
    let total_difficulty = 0;
    let total_ratings = 0;
    let num_ratings = 0;

    for (let course of schedule) {
        for (let section of course) {
            for (let instructor_id of section.instructors) {
                let instructor = instructors[instructor_id];
                if (
                    instructor.avg_rating &&
                    instructor.avg_difficulty &&
                    instructor.num_ratings
                ) {
                    total_avg_rating += parseFloat(instructor.avg_rating);
                    total_difficulty += parseFloat(instructor.avg_difficulty);
                    total_ratings += parseInt(instructor.num_ratings);
                    num_ratings++;
                }
            }
        }
    }

    if (num_ratings === 0) {
        return;
    }

    let avg_schedule_rating: any = {};

    avg_schedule_rating.avg_rating = total_avg_rating / num_ratings;
    avg_schedule_rating.avg_difficulty = total_difficulty / num_ratings;
    avg_schedule_rating.total_ratings = total_ratings;

    return avg_schedule_rating;
}

function getLatestClassTime(schedule: any[]) {
    let latest_time = null;

    for (let course of schedule) {
        for (let section of course) {
            if (section.end_time) {
                let end_time = getDateFromTime(section.end_time);
                if (!latest_time || end_time > latest_time) {
                    latest_time = end_time;
                }
            }
        }
    }

    if (!latest_time) {
        return;
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
    }).format(latest_time);
}

function getEarliestClassTime(schedule: any[]) {
    let earliest_time = null;

    for (let course of schedule) {
        for (let section of course) {
            if (section.start_time) {
                let start_time = getDateFromTime(section.start_time);
                if (!earliest_time || start_time < earliest_time) {
                    earliest_time = start_time;
                }
            }
        }
    }

    if (!earliest_time) {
        return;
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
    }).format(earliest_time);
}
function computeCourseUnits(sections_by_instruction_types: any) {
    const combinations: any[][] = [];
    const n = sections_by_instruction_types.length;

    function backtrack(combo: any, i: number): void {
        if (combo.length === n) {
            if (!checkTimeConflict([combo])) {
                combinations.push(combo.slice());
            }
            return;
        }

        if (i >= sections_by_instruction_types.length) {
            return;
        }

        const section_types = sections_by_instruction_types[i];

        for (const section of section_types) {
            combo.push(section);
            backtrack(combo, i + 1);
            combo.pop();
        }

        backtrack(combo, i + 1);
    }

    backtrack([], 0);

    return combinations;
}

async function getAllInstructors(schedules: any[]) {
    let instructor_ids: Set<number> = new Set();

    for (let schedule of schedules) {
        for (let course of schedule) {
            for (let section of course) {
                for (let instructor of section.instructors) {
                    instructor_ids.add(instructor);
                }
            }
        }
    }

    let instructors: any = {};

    for (let instructor_id of instructor_ids) {
        instructors[instructor_id] = await db.getInstructor(instructor_id);
    }

    return instructors;
}

function coursesWithMappedSections(courses: any) {
    let coursesWithMappedSections: any = [];
    let idToCourseMapping: any = {};
    let count = 0;
    for (let course of courses) {
        let section_ids = [];
        for (let section of course) {
            count++;
            section_ids.push(count);
            idToCourseMapping[count] = section;
        }
        coursesWithMappedSections.push(section_ids);
    }
    return [coursesWithMappedSections, idToCourseMapping];
}

function getSchedulesFromMapping(mappedSchedules: any[][], mapping: any) {
    let schedules: any[] = [];
    for (let mappedSchedule of mappedSchedules) {
        let schedule: any[] = [];
        for (let section_id of mappedSchedule) {
            schedule.push(mapping[section_id]);
        }
        schedules.push(schedule);
    }
    return schedules;
}
export default router;
