import express from "express";
import ngrok from "ngrok";
import { spawn } from "child_process";
import Table from "cli-table3"; // For tabular logs
import chalk from "chalk"; // For colored logs

const app = express();

app.use(express.text()); // To parse text bodies

let deployedCorrectly = false;

// Create a persistent table to store logs
const table = new Table({
  head: [chalk.blue("Timestamp"), chalk.yellow("Log Content")],
  colWidths: [35, 70],
  wordWrap: true, // Ensure word wrap for longer log messages
  wrapOnWordBoundary: false, // Wrap on word boundary
  style: { "padding-left": 0, "padding-right": 0 },
});

// Function to log a new entry into the existing table
const logWithTable = (timestamp: string, body: string) => {
  if (!deployedCorrectly) {
    return;
  }

  let bodyToDisplay = body;

  try {
    const parsed = JSON.parse(body);
    if (typeof parsed === "string") {
      bodyToDisplay = parsed;
    }
  } catch (error) {
    // do nothing
  }

  table.push([chalk.green(timestamp), bodyToDisplay]);

  // Clear the console before printing the updated table (optional, for cleaner output)
  console.clear();

  console.log(table.toString());
};

// Endpoint to log the body of the request
app.post("/log-body", (req, res) => {
  const timestamp = new Date().toISOString();

  logWithTable(timestamp, req.body); // Use JSON.stringify for better readability if it's a JSON object

  res.send("success");
});

// Start the Express server
const port = 3000;
app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);

  // Connect to ngrok to expose the server to the public internet
  try {
    const url = await ngrok.connect(port);
    console.log(`Public URL: ${url}`);

    // Run your custom command here with the updated environment variables
    console.log("Running bp deploy command...");

    const nodemon = spawn("nodemon", [
      "--watch",
      "./src/*",
      "--ext",
      "ts",
      "--exec",
      `bp deploy -v -y --secrets "DEV_LOGS_URL=${url}/log-body"`,
    ]);

    nodemon.stdout.on("data", (data) => {
      const rawData = data.toString();
      if (!deployedCorrectly) {
        console.log(`Runner log: ${data}`);
      }
      if (rawData.includes("Integration deployed")) {
        // reset the table
        table.length = 0;
        console.clear();
        console.log("Dev deployed! Waiting for logs...");
        deployedCorrectly = true;
      }
    });

    nodemon.stderr.on("data", (data) => {
      console.error(`Runner error: ${data}`);

      const rawData = data.toString();
      if (rawData.includes("Could not update integration")) {
        // restart the process
        table.length = 0;
        console.clear();
        console.log("Failed to update! Save again to retry...");
        deployedCorrectly = false;
      }
    });

    nodemon.on("close", (code) => {
      console.log(`Child process exited with code ${code}`);
      console.log("Deployed successfully!");
    });
  } catch (error) {
    console.error("Error starting ngrok:", error);
  }
});
