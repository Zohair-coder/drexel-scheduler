import pg from "pg";
import db_config from "./db_config.js";

const { Pool } = pg;

class Database {
    pool: pg.Pool;
    constructor() {
        this.pool = new Pool(db_config);
    }

    getSections(subject_code: string, course_number: string) {
        let query =
            "SELECT * FROM courses WHERE subject_code = $1 AND course_number = $2";
        let values = [subject_code, course_number];
        return this.pool.query(query, values);
    }

    async getInstructors(crn: number) {
        let query =
            "SELECT instructor_id FROM course_instructor WHERE course_id = $1";
        let values = [crn];
        let response = await this.pool.query(query, values);
        let instructor_ids = response.rows.map((row) => row.instructor_id);
        let instructors = [];
        for (let id of instructor_ids) {
            let query = "SELECT * FROM instructors WHERE id = $1";
            let values = [id];
            let response = await this.pool.query(query, values);
            instructors.push(response.rows[0]);
        }
        return instructors;
    }

    async getInstructor(instructor_id: number) {
        let query = "SELECT * FROM instructors WHERE id = $1";
        let values = [instructor_id];
        let results = await this.pool.query(query, values);
        return results.rows[0];
    }
}

export default Database;
