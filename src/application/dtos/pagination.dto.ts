import { z } from "zod";

/**
 * Schema for pagination input
 */
export const paginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

/**
 * Input DTO for pagination
 */
export type PaginationInput = z.infer<typeof paginationInputSchema>;

/**
 * Schema for paginated response
 */
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T
) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().min(0),
  });
}

/**
 * Generic paginated response DTO
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
