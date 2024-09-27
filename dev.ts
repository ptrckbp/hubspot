import express from "express";
import ngrok from "ngrok";
import { spawn } from "child_process";
import Table from "cli-table3"; // For tabular logs
import chalk from "chalk"; // For colored logs

const app = express();

app.use(express.text()); // To parse text bodies

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
  table.push([chalk.green(timestamp), JSON.parse(body)]);

  // Clear the console before printing the updated table (optional, for cleaner output)
  console.clear();

  console.log(table.toString());
};

// Endpoint to log the body of the request
app.post("/log-body", (req, res) => {
  let body = req.body;

  const timestamp = new Date().toISOString();

  // Try to parse the body as JSON, if it's not valid JSON, just return the original body
  try {
    body = JSON.parse(body);
  } catch (e) {
    // Do nothing
  }

  logWithTable(timestamp, JSON.stringify(body, null, 2)); // Use JSON.stringify for better readability if it's a JSON object

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
      console.log(`Runner log: ${data}`);
    });

    nodemon.stderr.on("data", (data) => {
      console.error(`Runner error: ${data}`);
    });

    nodemon.on("close", (code) => {
      console.log(`Child process exited with code ${code}`);
      console.log("Deployed successfully!");
    });
  } catch (error) {
    console.error("Error starting ngrok:", error);
  }
});
