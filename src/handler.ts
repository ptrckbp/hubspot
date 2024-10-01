import { log } from "./utils/logToRemote";
import verifyHubSpotSignature from "./verify-webhook";
import * as bp from ".botpress";
export type IntegrationProps = bp.IntegrationProps;
export type Handler = IntegrationProps["handler"];

const handler: Handler = async ({ req: req, ctx: ctx, client: client }) => {
  await log("webhook recieved");

  if (!req.body) {
    await log("no request body");
    return {
      status: 400,
      body: "No request body",
    };
  }

  try {
    const signature = req.headers["x-hubspot-signature"];

    // Verify the HubSpot signature
    verifyHubSpotSignature(
      req.body,
      signature,
      ctx.configuration.hubspotAppSecret
    );
  } catch (error) {
    return await log("Error verifying HubSpot signature");
  }

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
        await log("contactCreated event created");
      } else {
        await log("ignore webhook" + subscriptionType + changeFlag + objectTypeId);
      }
    }

    // Respond with success
    return {
      status: 200,
      body: "Webhook received",
    };
  } catch (err: any) {
    await log("there was an error", err.message);

    console.error("Error processing webhook:", err.message);
    return {
      status: 400,
      body: "Error processing webhook",
    };
  }

  throw new Error("Not implemented");
};

export default handler;
