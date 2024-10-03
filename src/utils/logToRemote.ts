import * as bp from ".botpress";
const logEndpoint = bp.secrets.DEV_LOGS_URL;

const log = async (...toLog: any[]) => {
  if (!logEndpoint) {
    return;
  }

  const bodyToSend = JSON.stringify({
    timestamp: new Date().toISOString(),
    toLog,
    type: "log",
  });

  try {
    const response = await fetch(logEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

// Preserve original console.log functionality
const originalConsoleLog = console.log;

if (logEndpoint && logEndpoint.length > 0) {
  console.log = async (...args: any[]) => {
    // Call original console.log to ensure messages appear in the local console
    originalConsoleLog.apply(console, args);

    // Also send the log message to the remote log function
    await log(...args);
  };
}
