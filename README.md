## Drexel Scheduler

### Setup

Make sure the database has been setup beforehand (see [webscraper](https://gitlab.cci.drexel.edu/cs-t480-advanced-web-dev-project/schedule-web-scraper) for more information on how to set up database).

Make sure Node.js is installed. Then run:

```bash
cd back
npm install
npm run build
npm run start
cd ..
```

This should start the backend server. Then run:

````bash
cd front
npm install
npm run start
```

This should start the frontend server.

### Usage

#### Defined API endpoints

POST: `http://localhost:3000/api/courses/generateschedules`
Example Body: `{"courses": ["CS 265", "CS 260", "CS 270"], "num_courses": 2}`
````
