import "./utils/logToRemote";
import * as botpress from ".botpress";
import handler from "./handler";
import { createWebhook, transcribeVideo } from "./transcribeVideo";

console.info("starting integration");

class NotImplementedError extends Error {
  constructor() {
    super("Not implemented");
  }
}

export default new botpress.Integration({
  register: async ({ctx}) => {
    /**
     * This is called when a bot installs the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
    await console.log('registering webhook')
    await createWebhook(ctx.configuration.azureApiKey,
          `https://webhook.botpress.cloud/${ctx.webhookId}/transcription`)
    await console.log('webhook created')
  },
  unregister: async () => {
    /**
     * This is called when a bot removes the integration.
     * You should use this handler to instanciate ressources in the external service and ensure that the configuration is valid.
     */
  },
  actions: {
    getTranscription: async ({ ctx, input }) => {
      await console.log("transcribing video");
      try {
        const result = await transcribeVideo(
          input.videoUrl,
          ctx.configuration.azureApiKey,
          `https://webhook.botpress.cloud/${ctx.webhookId}/transcription`
        );
        await console.log("transcription result:", result);
        return { transcription: result };
      } catch (error) {
        await console.log("there was an error: " + error.message);
      }
    },
  },
  channels: {
    channel: {
      messages: {
        text: async () => {
          throw new NotImplementedError();
        },
        image: async () => {
          throw new NotImplementedError();
        },
        markdown: async () => {
          throw new NotImplementedError();
        },
        audio: async () => {
          throw new NotImplementedError();
        },
        video: async () => {
          throw new NotImplementedError();
        },
        file: async () => {
          throw new NotImplementedError();
        },
        location: async () => {
          throw new NotImplementedError();
        },
        carousel: async () => {
          throw new NotImplementedError();
        },
        card: async () => {
          throw new NotImplementedError();
        },
        choice: async () => {
          throw new NotImplementedError();
        },
        dropdown: async () => {
          throw new NotImplementedError();
        },
        bloc: async () => {
          throw new NotImplementedError();
        },
      },
    },
  },
  handler,
});
