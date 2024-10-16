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
  actions: {
    getTranscription: {
      title: "Get Transcription",
      description: "This action is used to get the transcription of a call.",
      input: {
        schema: z.object({
          videoUrl: z.string().describe('URL of video to transcribe'),
        }),
      },
      output: {
        schema: z.object({
          transcription: z.string().describe('Transcription of video'),
        })
      },
   
    },
  },
  events: {
    contactCreated: {
      title: "Contact Created",
      description:
        "This event is received when a new contact is created in HubSpot.",
      schema: z
        .object({
          objectId: z
            .number()
            .describe("The ID of the contact where the contact was created"),
        })
        .passthrough(),
    },
    callCreated: {
      title: "Call Created",
      description:
        "This event is received when a new call is created in HubSpot.",
      schema: z
        .object({
          objectId: z
            .number()
            .describe("The ID of the call where the call was created"),
        })
        .passthrough(),
    },
    transcriptCreated: {
      title: "Transcript Created",
      description:
        "This event is received when a new transcript is created in HubSpot.",
      schema: z
        .object({
          transcript: z
            .string()
            .describe("The transcript of the call"),
        })
        .passthrough(),
    }
  },
  configuration: {
    schema: z.object({
      hubspotAppSecret: z.string().describe("HubSpot App Secret"),
      openaiApiKey: z.string().describe("OpenAI API Key"),
      azureApiKey: z.string().describe("Azure API Key"),
    }),
    
  },
  secrets: {
    DEV_LOGS_URL: {
      optional: true,
      description: "The URL to send logs to",
    },
  },
});
