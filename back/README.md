## Backend

### Setup

Make sure Node.js is installed. Then run:

```bash
npm install
```

Make sure the database has been setup beforehand (see [webscraper](https://gitlab.cci.drexel.edu/cs-t480-advanced-web-dev-project/schedule-web-scraper) for more information on how to set up database).

### Run

```bash
npm run watch
```

This will incorporate live changes.

### Usage

#### Defined API endpoints

POST: `http://localhost:3000/api/courses/generateschedules`
Body: `{"courses": ["CS 265", "CS 260", "CS 270"], "num_courses": 2}`
`num_courses` is optional and defaults to length of courses.
