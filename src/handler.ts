import { getTranscriptFromWebhook } from "./transcribeVideo";
import verifyHubSpotSignature from "./verify-webhook";
import * as bp from ".botpress";
export type IntegrationProps = bp.IntegrationProps;
export type Handler = IntegrationProps["handler"];

const handler: Handler = async ({ req: req, ctx: ctx, client: client }) => {
  await console.log("webhook recieved");

  if (req.path === "/transcription") {
    await console.log("got a transcription webhook");
    const microsoftChallenge = req.headers["x-microsoftspeechservices-event"];
    await console.log({
      reqBody: req.body,
      reqHeaders: req.headers,
      query: req.query,
    });

    // ex. validationToken=e062725f75d64dbc8ee8b70bdf131526
    // use regex to extract the token, get anything between = and &
    const validationToken: string | undefined = req.query.match(/=(.*?)&/)?.[1];

    if (microsoftChallenge && validationToken) {
      await console.log("transcription challenge webhook recieved");
      return {
        // this is just to validate the token
        status: 200,
        body: validationToken,
      };
    } else {
      await console.log("transcription webhook recieved. Yo!");
      // get
      try {
        const { self } = JSON.parse(req.body as string);

        const transcript = await getTranscriptFromWebhook(
          self,
          ctx.configuration.azureApiKey
        );

        await console.log(
          "🚀 ~ consthandler:Handler= ~ transcript:",
          transcript
        );

        // lets create an event

        await client.createEvent({
          type: "transcriptCreated",
          payload: {
            transcript,
          },
        });

        await console.log("done!");
      } catch (error) {
        await console.log("🚀 ~ consthandler:Handler= ~ error:", error.message);
      }
      return {
        status: 200,
        body: "Webhook received",
      };
    }
  }

  if (!req.body) {
    await console.log("no request body");
    return {
      status: 400,
      body: "No request body",
    };
  }

  await console.log(req.body);

  // try {
  //   const signature = req.headers["x-hubspot-signature"];

  //   // Verify the HubSpot signature // keep this for dev, to test fast
  //   verifyHubSpotSignature(
  //     req.body,
  //     signature,
  //     ctx.configuration.hubspotAppSecret
  //   );
  // } catch (error) {
  //   return await console.log("Error verifying HubSpot signature");
  // }

  try {
    const webhookEvents = JSON.parse(req.body) as Array<{
      objectId: number;
      subscriptionType: string;
      changeFlag: string;
      objectTypeId: string;
    }>;

    for (const {
      objectId,
      subscriptionType,
      changeFlag,
      objectTypeId,
    } of webhookEvents) {
      if (
        subscriptionType === "object.creation" &&
        (changeFlag === "NEW" || changeFlag === "CREATED") &&
        objectTypeId === "0-1"
      ) {
        await client.createEvent({
          type: "contactCreated",
          payload: {
            objectId,
          },
        });
        await console.log("contactCreated event created: " + objectId);
      } else if (
        subscriptionType === "object.creation" &&
        (changeFlag === "NEW" || changeFlag === "CREATED") &&
        objectTypeId === "0-48"
      ) {
        await client.createEvent({
          type: "callCreated",
          payload: {
            objectId,
          },
        });
        await console.log("callCreated event created: " + objectId);
      } else {
        await console.log(
          "ignore webhook" + subscriptionType + changeFlag + objectTypeId
        );
      }
    }

    // Respond with success
    return {
      status: 200,
      body: "Webhook received",
    };
  } catch (err: any) {
    await console.log("there was an error: " + err.message);

    console.error("Error processing webhook:", err.message);
    return {
      status: 400,
      body: "Error processing webhook",
    };
  }

  throw new Error("Not implemented");
};

export default handler;
