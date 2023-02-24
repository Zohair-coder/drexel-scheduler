let port;
if (process.env.DB_PORT) {
    port = parseInt(process.env.DB_PORT);
} else {
    port = 5432;
}

let config = {
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "schedulerdb",
    password: process.env.DB_PASSWORD || "",
    port,
};

export default config;
