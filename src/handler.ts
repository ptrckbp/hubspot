import { log } from "./utils/logToRemote";
import verifyHubSpotSignature from "./verify-webhook";
import * as bp from ".botpress";
export type IntegrationProps = bp.IntegrationProps;
export type Handler = IntegrationProps["handler"];

const handler: Handler = async ({ req: req, ctx: ctx }) => {
  try {
    const signature = req.headers["x-hubspot-signature"];

    // Verify the HubSpot signature
    verifyHubSpotSignature(req.body, signature, ctx.configuration.hubspotAppSecret);

    await log("success");
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
