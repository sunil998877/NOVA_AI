import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { app } from "./app.js";

const syncServer = async () => {
    await connectDb();
    const server = app.listen(env.port, () => {
        console.log(`NovaAI backend is running on port ${env.port}`);
    });
    server.on("error", (error) => {
        console.error("Error starting the server:", error);
        process.exit(1);
    });
};

syncServer();