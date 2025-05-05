import { z } from "zod";

export const leaveRoomParamsSchema = z.object({
  roomId: z.preprocess((val) => parseInt(val), z.number().int().nonnegative()),
});

export const getRoomMessagesParamsSchema = z.object({
  roomId: z.preprocess((val) => parseInt(val), z.number().int().nonnegative()),
});

export const getRoomMessagesQuerySchema = z.object({
  before: z
    .string()
    .datetime()
    .optional()
    .or(z.literal("").transform(() => undefined)), // ak by prišiel prázdny string
  limit: z
    .preprocess((val) => parseInt(val), z.number().int().positive().max(100))
    .optional(),
});

export const updateLastSeenParamsSchema = z.object({
  roomId: z.preprocess((val) => parseInt(val), z.number().int().nonnegative()),
});
