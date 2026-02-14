import { z } from 'zod';

export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
};

export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z.object({
    sport: z.string().min(1, 'Sport is required'),
    homeTeam: z.string().min(1, 'Home team is required'),
    awayTeam: z.string().min(1, 'Away team is required'),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
}).superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'End time must be after start time',
            path: ['endTime'],
        });
    }
});

export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().min(0),
    awayScore: z.coerce.number().int().min(0),
});
