// Pluggable delivery for the weekly digest. This mirrors the assistant provider
// pattern: the app builds the digest content itself, and the channel that sends
// it is swapped behind one interface. The default channel is in-app only (no
// paid services); wiring a free email sender means implementing one adapter and
// returning it from createConfiguredDigestDelivery.

import type { WeeklyDigest } from "@/lib/radar/digest";

export type DigestDeliveryResult = {
  delivered: boolean;
  channel: "in-app" | "email" | "log";
  detail: string;
};

export type DigestDeliveryAdapter = (
  digest: WeeklyDigest,
  recipient: string,
) => Promise<DigestDeliveryResult>;

// In-app default: nothing is sent anywhere. The digest is rendered in the app
// (the /radar view) and this reports that no push channel is configured.
const inAppDelivery: DigestDeliveryAdapter = async (digest) => ({
  delivered: false,
  channel: "in-app",
  detail: `Digest ready in-app (${digest.itemCount} items). No push channel configured.`,
});

export function createConfiguredDigestDelivery(
  env: NodeJS.ProcessEnv = process.env,
): DigestDeliveryAdapter {
  // When a free email channel is configured, return an email adapter here.
  // Intentionally left as in-app until the operator opts into a delivery
  // channel, so the feature works with zero external services by default.
  if (env.DIGEST_DELIVERY === "email") {
    return loggingEmailDelivery;
  }

  return inAppDelivery;
}

// Placeholder email channel: logs what would be sent. Replace the body with a
// real free-tier sender (SMTP / Resend / etc.) when the operator opts in.
const loggingEmailDelivery: DigestDeliveryAdapter = async (
  digest,
  recipient,
) => {
  console.info(
    `[digest] would email "${digest.subject}" to ${recipient}\n${digest.text}`,
  );

  return {
    delivered: false,
    channel: "log",
    detail: `Logged digest for ${recipient}; connect a real email sender to deliver.`,
  };
};
