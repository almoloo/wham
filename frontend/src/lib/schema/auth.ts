import { z } from "zod";
import type {
  BffVerifyResponse,
  NonceResponse,
  RefreshResponse,
  UserProfile,
  VerifyRequest,
  VerifyResponse,
} from "@/types/auth";
import { addressSchema, hexSchema, isoDateTimeSchema } from "./common";

/*
 * Zod mirrors of src/types/auth.ts. Nullable fields use `.nullable()` and NOT
 * `.optional()`: the backend emits nulls, never omits them, and an absent key
 * is contract drift that must fail here rather than render `undefined`.
 */

export const userProfileSchema = z.object({
  address: addressSchema,
  displayName: z.string().nullable(),
  ensName: z.string().nullable(),
  avatarSeed: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  telegramHandle: z.string().nullable(),
  timezone: z.string(),
  locale: z.enum(["en", "fa"]),
  firstLogin: z.boolean(),
  createdAt: isoDateTimeSchema,
  preferences: z.object({
    notifyPaymentDueHours: z.array(z.number().int()),
    notifyBidWindow: z.boolean(),
    notifyRoundSettled: z.boolean(),
    channelEmail: z.boolean(),
    channelTelegram: z.boolean(),
    channelInApp: z.boolean(),
  }),
}) satisfies z.ZodType<UserProfile>;

export const nonceResponseSchema = z.object({
  // EIP-4361: at least 8 alphanumeric characters. viem's createSiweMessage
  // rejects anything else, so catch it here with a clearer error.
  nonce: z.string().regex(/^[a-zA-Z0-9]{8,}$/, "Expected an alphanumeric nonce of at least 8 characters"),
  issuedAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
}) satisfies z.ZodType<NonceResponse>;

export const verifyRequestSchema = z.object({
  message: z.string().min(1),
  signature: hexSchema,
}) satisfies z.ZodType<VerifyRequest>;

export const verifyResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: isoDateTimeSchema,
  user: userProfileSchema,
}) satisfies z.ZodType<VerifyResponse>;

export const refreshResponseSchema = z.object({
  token: z.string().min(1),
  expiresAt: isoDateTimeSchema,
}) satisfies z.ZodType<RefreshResponse>;

export const bffVerifyResponseSchema = z.object({
  user: userProfileSchema,
}) satisfies z.ZodType<BffVerifyResponse>;
