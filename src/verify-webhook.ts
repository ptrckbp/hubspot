import crypto from "crypto";


// Function to verify the HubSpot webhook signature
const verifyHubSpotSignature = (
  rawBody: string,
  signature: string | undefined,
  hubspotAppSecret: string
): void => {
  if (!signature) {
    throw new Error("Missing signature");
  }

  const sourceString = `${hubspotAppSecret}${rawBody}`;
  const hash = crypto.createHash("sha256").update(sourceString).digest("hex");

  if (hash !== signature) {
    throw new Error("Signature mismatch");
  }
};

export default verifyHubSpotSignature;
