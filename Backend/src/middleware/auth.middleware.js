import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { toPublicUser } from "../utils/user.js";

export const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!env.jwtSecret) {
            return res.status(500).json({ error: "JWT_SECRET is not configured" });
        }

        const token = header.slice("Bearer ".length);
        const payload = jwt.verify(token, env.jwtSecret);
        const user = await User.findById(payload.sub);

        if (!user) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const publicUser = toPublicUser(user);
        req.user = {
            ...publicUser,
            id: String(user.id),
        };
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
};
