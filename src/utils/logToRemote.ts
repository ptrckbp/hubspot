import * as bp from ".botpress";

export const log = async (content: any) => {
  if (!bp.secrets.DEV_LOGS_URL || !bp.secrets.DEV_LOGS_URL.length) { // if we are in prod we don't want to log everything remotely.
    console.log(content);
    return;
  }

  const logEndpoint = `${bp.secrets.DEV_LOGS_URL}`;
  // stringify content if not string
  const body = typeof content === "string" ? content : JSON.stringify(content);

  try {
    const response = await fetch(logEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending log content:", error);
  }
};
