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
}

export default Database;
