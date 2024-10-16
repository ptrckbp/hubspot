import fetch from "node-fetch";

// Function to create a webhook using Microsoft API
export async function createWebhook(
  apiKey: string,
  webhookUrl: string
): Promise<string | void> {
  const response = await fetch(
    "https://eastus.api.cognitive.microsoft.com/speechtotext/webhooks?api-version=2024-05-15-preview", // todo this url should come from config.
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: "Transcription Webhook",
        events: {
          transcriptionCompletion: true,
          transcriptionDeletion: true,
          transcriptionProcessing: true,
          transcriptionCreation: true,
        },
        webUrl: webhookUrl,
      }),
    }
  );
  const data = await response.json();
  await console.log("Webhook creation response: " + JSON.stringify(data));

  if (data.message === "A web hook with this configuration already exists.") {
    return; // do nothing, we're good!
  }

  if (!response.ok) {
    throw new Error(`Failed to create webhook: ${response.statusText}`);
  }

  return data.webhookId; // Update this based on the actual response structure.
}

// Function to submit a video for transcription using Microsoft Speech-to-Text API (batch)
async function submitTranscriptionBatch(
  videoFilePath: string,
  apiKey: string
): Promise<void> {
  console.log("🚀 ~ videoFilePath:", videoFilePath);
  await console.log("before form");
  await console.log("after form");

  await console.log("before post");
  const start = Date.now();
  const response = await fetch(
    "https://eastus.api.cognitive.microsoft.com/speechtotext/transcriptions:submit?api-version=2024-05-15-preview",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: "Transcription Batch",
        locale: "en-US",
        properties: {
          diarizationEnabled: false,
          wordLevelTimestampsEnabled: false,
          displayFormWordLevelTimestampsEnabled: false,
          punctuationMode: "DictatedAndAutomatic",
          profanityFilterMode: "Masked",
          timeToLive: "P2D",
        },
        customProperties: {
          transcriptId: 4,
        },
        contentUrls: [videoFilePath],
      }),
    }
  );
  await console.log("post response, time: " + (Date.now() - start));

  if (!response.ok) {
    throw new Error(`Failed to submit transcription: ${response.statusText}`);
  }

  const data = await response.json();
  await console.log(
    "Transcription submission response: " + JSON.stringify(data, null, 2)
  );
}

// Main function to handle video URL, transcription submission, and webhook creation
export async function transcribeVideo(
  videoUrl: string,
  apiKey: string,
  webhookUrl: string
): Promise<string> {
  await console.log("🚀 ~ webhookUrl: " + webhookUrl);
  try {
    await submitTranscriptionBatch(videoUrl, apiKey);

    await console.log("Transcription submitted: " + videoUrl);
  } catch (error) {
    await console.log("Error during transcription process: " + error.message);
    throw new Error("Transcription failed.");
  }

  // return the id of the transcription job
  return "Transcription_Id";
}

export async function getTranscriptFromWebhook(
  selfUrl: string,
  apiKey: string
) {
  // self is like this : "https://eastus.api.cognitive.microsoft.com/speechtotext/transcriptions/4e5af82e-7063-4c7b-877c-595d2c461677?api-version=2024-05-15-preview"

  // fetch self first

  const response = await fetch(selfUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get transcription: ${response.statusText}`);
  }

  await console.log("got transcription response");
  const transcriptResponse = await response.json();

  // make sure properties.status is "Succeeded" before proceeding

  if (transcriptResponse.status !== "Succeeded") {
    throw new Error("Transcription is not ready yet.");
  }

  // now we get the files api url from the response

  const filesUrl = transcriptResponse.links.files;

  // now we fetch the files

  const filesResponse = await fetch(filesUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!filesResponse.ok) {
    throw new Error(
      `Failed to get transcription files: ${filesResponse.statusText}`
    );
  }

  await console.log("got files response");

  const files = await filesResponse.json();
  await console.log("🚀 ~ files:", files);

  // now that we have the response, we fetch the transcription from the values
  const transcriptionFileUrl = files.values.find(
    (value) => value.kind === "Transcription"
  )?.self;
  await console.log("🚀 ~ transcriptionFileUrl:", transcriptionFileUrl);

  // now we need to fetch the file itself

  const transcriptionResponse = await fetch(transcriptionFileUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!transcriptionResponse.ok) {
    throw new Error(
      `Failed to get transcription: ${transcriptionResponse.statusText}`
    );
  }

  await console.log("got transcription content response");

  const transcription = await transcriptionResponse.json();
  await console.log(
    "🚀 ~ getTranscriptFromWebhook ~ transcription:",
    transcription
  );

  // now get get the blob url from the response
  const blobUrl = transcription.links.contentUrl;
  await console.log("🚀 ~ blobUrl:", blobUrl);

  // now we fetch the blob
  const blobResponse = await fetch(blobUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!blobResponse.ok) {
    throw new Error(
      `Failed to get transcription blob: ${blobResponse.statusText}`
    );
  }

  await console.log("got transcription blob response");

  const blob = await blobResponse.json();
  await console.log("🚀 ~ blob:", blob);

  return blob.combinedRecognizedPhrases[0].display;
}
