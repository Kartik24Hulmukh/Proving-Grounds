/**
 * Adapter Payload Contract — P6.1
 *
 * Defines the Zod schema for agent submission intake.
 * Every submission must validate against this contract.
 */

import { z } from "zod/v4";

export const adapterPayloadSchema = z.object({
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  vendor: z.string().min(2, "Vendor must be at least 2 characters"),
  homepage: z.string().url("Homepage must be a valid URL"),
  adapterKey: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Adapter key must be lowercase alphanumeric with hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  contactEmail: z.string().email("Contact email must be valid"),
  versionLabel: z.string().min(1, "Version label is required"),
  adapterConfig: z.object({
    runtime: z.enum(["browser", "cli", "api"]),
    entrypoint: z.string().min(1),
    envVars: z.array(z.string()).default([]),
    capabilities: z.array(z.string()).default([]),
  }),
  scenarios: z.array(z.string()).min(1, "At least one scenario slug is required"),
});

export type AdapterPayload = z.infer<typeof adapterPayloadSchema>;

/**
 * Validate a submission payload. Throws on invalid.
 */
export function validateSubmission(payload: unknown): AdapterPayload {
  return adapterPayloadSchema.parse(payload);
}

/**
 * Safe validation — returns { success, data } or { success, error }.
 */
export function safeValidateSubmission(payload: unknown) {
  return adapterPayloadSchema.safeParse(payload);
}
