import mysql from "mysql2/promise";
import { env } from "./env.js";
import { tableStatements } from "../schema/index.js";

let pool;

export const getPool = () => {
    if (!pool) {
        throw new Error("MySQL pool is not initialized. Call connectDb() first.");
    }
    return pool;
};

export const query = async (sql, params = []) => {
    const [rows] = await getPool().execute(sql, params);
    return rows;
};

export const execute = async (sql, params = []) => {
    const [result] = await getPool().execute(sql, params);
    return result;
};

export const connectDb = async () => {
    const { host, port, user, password, database } = env.mysql;

    try {
        const bootstrap = await mysql.createConnection({ host, port, user, password });
        await bootstrap.query(
            `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await bootstrap.end();

        pool = mysql.createPool({
            host,
            port,
            user,
            password,
            database,
            waitForConnections: true,
            connectionLimit: 10,
        });

        for (const statement of tableStatements) {
            await pool.query(statement);
        }

        console.log(`Connected to MySQL successfully (${database})`);
        return pool;
    } catch (error) {
        console.error("Error connecting to MySQL:", error.message);
        if (error.code === "ER_ACCESS_DENIED_ERROR") {
            console.error(
                "Set MYSQL_USER and MYSQL_PASSWORD in Backend/.env to your local MySQL credentials (Workbench uses the same root password)."
            );
        }
        process.exit(1);
    }
};
