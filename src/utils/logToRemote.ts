import * as bp from ".botpress";

export const log = async (...args: any[]) => {
  if (!bp.secrets.DEV_LOGS_URL || !bp.secrets.DEV_LOGS_URL.length) {
    console.log(...args);
    return;
  }

  const logEndpoint = `${bp.secrets.DEV_LOGS_URL}`;

  // if there are multiple arguments, combine them into an array
  const body = args.length === 1 ? args[0] : JSON.stringify(args, null, "\t");

  const bodyToSend =
    typeof body === "string" ? body : JSON.stringify(body, null, "\t");

  try {
    const response = await fetch(logEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: bodyToSend,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending log content:", error);
  }
};
