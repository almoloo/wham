import { z } from "zod";
import { API_ERROR_CODES, type Address, type ApiError, type Hex } from "@/types/common";

/*
 * Zod mirrors of src/types/common.ts. Each `satisfies z.ZodType<T>` makes the
 * compiler fail if a schema and its hand-written type drift apart.
 */

export const addressSchema = z.custom<Address>(
  (v) => typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v),
  "Expected a 0x-prefixed 20-byte address",
);

export const hexSchema = z.custom<Hex>(
  (v) => typeof v === "string" && /^0x[0-9a-fA-F]*$/.test(v),
  "Expected a 0x-prefixed hex string",
);

// `offset: true` accepts "+00:00" as well as "Z": .NET serialises UTC
// DateTimeOffset values both ways, and both are the same instant.
export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    traceId: z.string(),
  }),
}) satisfies z.ZodType<ApiError>;

/** A backend response that does not match its contract. Callers map this to the `INTERNAL` envelope. */
export class ApiContractError extends Error {
  constructor(
    readonly label: string,
    readonly issues: z.core.$ZodIssue[],
  ) {
    super(
      `${label} does not match its contract: ` +
        issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "),
    );
    this.name = "ApiContractError";
  }
}

/**
 * Parse an API response at the boundary (coding-standards: "every API response
 * is parsed"). Throws rather than returning a partial value: the .NET service
 * and the frontend will drift during the build, and that should fail loudly in
 * dev instead of rendering `undefined` downstream.
 */
export function parseApi<T>(schema: z.ZodType<T>, data: unknown, label = "API response"): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new ApiContractError(label, result.error.issues);
  return result.data;
}
