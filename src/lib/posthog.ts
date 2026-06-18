import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  if (posthogClient) return posthogClient;

  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  if (!apiKey || apiKey === "phc_dummy_server_key_for_build") {
    return null;
  }

  posthogClient = new PostHog(apiKey, { host });
  return posthogClient;
}

/**
 * Envoie un événement de tracking à PostHog depuis le serveur.
 */
export function trackEvent(
  userId: string,
  eventName: string,
  properties: Record<string, any> = {}
) {
  try {
    const client = getPostHogClient();
    if (client) {
      client.capture({
        distinctId: userId,
        event: eventName,
        properties: {
          ...properties,
          $lib: "posthog-node",
        },
      });
    }
  } catch (error) {
    console.error("Error tracking event to PostHog server-side:", error);
  }
}

/**
 * Identifie l'utilisateur et lui associe des propriétés dans PostHog.
 */
export function identifyUser(
  userId: string,
  properties: Record<string, any> = {}
) {
  try {
    const client = getPostHogClient();
    if (client) {
      client.identify({
        distinctId: userId,
        properties,
      });
    }
  } catch (error) {
    console.error("Error identifying user in PostHog server-side:", error);
  }
}
