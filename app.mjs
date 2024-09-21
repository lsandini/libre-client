import 'dotenv/config';
import { LibreLinkClient } from 'libre-link-unofficial-api';
import fetch from 'node-fetch';

// Create a new LibreLinkClient instance
const client = new LibreLinkClient({ 
  email: process.env.LIBRE_LINK_EMAIL, 
  password: process.env.LIBRE_LINK_PASSWORD 
});

const api_key = process.env.API_KEY;

// Function to generate API URLs with offset
const generateApiUrl = (index) => `https://ns-${index + 11}.oracle.cgmsim.com/api/v1/entries`;

const login = async () => {
  return await client.login();
};

const fetchConnections = async () => {
  return await client.fetchConnections();
};

const translateTrendArrow = (trendArrow) => {
  const trends = {
    0: "NOT DETERMINED",
    1: "SingleDown",
    2: "FortyFiveDown",
    3: "Flat",
    4: "FortyFiveUp",
    5: "SingleUp"
  };
  return trends[trendArrow] || "UNKNOWN";
};

const uploadToAPI = async (patientId, glucoseData, apiUrl) => {
  const headers = {
    'Content-Type': 'application/json',
    'api-secret': api_key
  };
  const body = {
    dateString: new Date().toISOString(),
    sgv: glucoseData.ValueInMgPerDl,
    type: "sgv",
    direction: translateTrendArrow(glucoseData.TrendArrow),
    date: Date.now()
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return `Data uploaded successfully for patient ${patientId} to ${apiUrl}`;
  } catch (error) {
    return `Error uploading data for patient ${patientId}: ${error.message}`;
  }
};

const main = async () => {
  console.clear();

  try {
    await login();
    console.log("Logged in successfully");

    const connections = await fetchConnections();
    console.log("Fetched connections => ");
    // console.log(JSON.stringify(connections, null, 2));

    for (const [index, connection] of connections.data.entries()) {
      const { patientId, firstName, lastName, glucoseMeasurement } = connection;
      const apiUrl = generateApiUrl(index);
      console.log(`\nProcessing data for ${firstName} ${lastName} (${patientId})`);
      console.log(`API URL: ${apiUrl}`);

      if (glucoseMeasurement) {
        console.log(`Glucose Value: ${glucoseMeasurement.ValueInMgPerDl} mg/dL (${glucoseMeasurement.Value} mmol/L)`);
        console.log(`Trend Arrow: ${glucoseMeasurement.TrendArrow} - ${translateTrendArrow(glucoseMeasurement.TrendArrow)}`);
        console.log(`Timestamp: ${glucoseMeasurement.Timestamp}`);

        // Upload data to API and log the result immediately
        const uploadResult = await uploadToAPI(patientId, glucoseMeasurement, apiUrl);
        console.log(uploadResult);
      } else {
        console.log(`No glucose data available for this patient`);
      }
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
};

main().catch(console.error);