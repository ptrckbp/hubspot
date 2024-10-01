import { IntegrationDefinition, messages, z } from "@botpress/sdk";
import { name, integrationName } from "./package.json";

export default new IntegrationDefinition({
  name: integrationName ?? name,
  version: "0.2.0",
  channels: {
    channel: {
      messages: { ...messages.defaults },
    },
  },
  events: {
    contactCreated: {
      title: "Contact Created",
      description: "This event is received when a new contact is created in HubSpot.",
      schema: z.object({
        objectId: z.number().describe("The ID of the contact where the contact was created")
      }).passthrough(),
    },
  },
  configuration: {
    schema: z.object({
      hubspotAppSecret: z.string().describe("HubSpot App Secret"),
    }),
  },
  secrets: {
    DEV_LOGS_URL: {
      optional: true,
      description: "The URL to send logs to",
    },
  },
});
