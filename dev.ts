import express from "express";
import ngrok from "ngrok";
import { spawn } from "child_process";
import chalk from "chalk"; // For colored logs

const app = express();

app.use(express.json()); // To parse json bodies

let deployedCorrectly = false;

// Create a persistent table to store logs

// Function to log a new entry into the existing table
const logWithTable = (body: { timestamp: string; toLog: any[] }) => {
  const { timestamp, toLog } = body;

  if (!deployedCorrectly) {
    return;
  }

  console.log(chalk.blue(timestamp), ...toLog);
};

// Endpoint to log the body of the request
app.post("/log-body", (req, res) => {
  logWithTable(req.body); // Use JSON.stringify for better readability if it's a JSON object

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
