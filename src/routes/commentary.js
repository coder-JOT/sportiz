import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
    const paramsValidation = matchIdParamSchema.safeParse(req.params);
    if (!paramsValidation.success) {
        return res.status(400).json({ error: "Invalid match ID", details: paramsValidation.error.issues });
    }

    const queryValidation = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
        return res.status(400).json({ error: "Invalid query params", details: queryValidation.error.issues });
    }

    const matchId = paramsValidation.data.id;
    const limit = Math.min(queryValidation.data.limit ?? 100, 100);

    try {
        const events = await db.select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json({ data: events });
    } catch (error) {
        console.error("Error fetching commentary:", error);
        res.status(500).json({ error: "Failed to fetch commentary" });
    }
});

commentaryRouter.post("/", async (req, res) => {
    const paramsValidation = matchIdParamSchema.safeParse(req.params);
    if (!paramsValidation.success) {
        return res.status(400).json({ error: "Invalid match ID", details: paramsValidation.error.issues });
    }

    const bodyValidation = createCommentarySchema.safeParse(req.body);
    if (!bodyValidation.success) {
        return res.status(400).json({ error: "Invalid payload", details: bodyValidation.error.issues });
    }

    const matchId = paramsValidation.data.id;
    const commentaryData = bodyValidation.data;

    try {
        const [insertedCommentary] = await db.insert(commentary).values({
            ...commentaryData,
            matchId,
        }).returning();

        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(matchId, insertedCommentary);
        }

        res.status(201).json({ data: insertedCommentary });
    } catch (error) {
        console.error("Error creating commentary:", error);
        res.status(500).json({ error: "Failed to create commentary" });
    }
});