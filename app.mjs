import 'dotenv/config';
import { LibreLinkClient } from 'libre-link-unofficial-api';
import fetch from 'node-fetch';

// Create a new LibreLinkClient instance
const client = new LibreLinkClient({ 
  email: process.env.LIBRE_LINK_EMAIL, 
  password: process.env.LIBRE_LINK_PASSWORD 
});

const api_key = process.env.API_KEY;

// Mapping of patient IDs to API URLs
const patientApiUrls = {
  "84a69a2c-74ff-11ef-9172-be31d2becf10": "https://ns-0.oracle.cgmsim.com/api/v1/entries",
  "9624baf6-d1b5-e811-8134-02d09c370615": "https://ns-3.oracle.cgmsim.com/api/v1/entries"
};

const login = async () => {
  return await client.login();
};

const fetchConnections = async () => {
  return await client.fetchConnections();
};

const fetchReadings = async () => {
  return await client.fetchReading();
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

const uploadToAPI = async (patientId, glucoseData) => {
  const api_url = patientApiUrls[patientId];
  if (!api_url) {
    console.error(`No API URL found for patient ${patientId}`);
    return;
  }

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
    const response = await fetch(api_url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`Data uploaded successfully for patient ${patientId} to ${api_url}`);
  } catch (error) {
    console.error(`Error uploading data for patient ${patientId}:`, error.message);
  }
};

const main = async () => {
  console.clear();

  try {
    await login();
    console.log("Logged in successfully");

    const connections = await fetchConnections();
    console.log("Fetched connections => ");
    console.log(JSON.stringify(connections, null, 2));

    for (const connection of connections.data) {
      const { patientId, firstName, lastName, glucoseMeasurement } = connection;
      console.log(`\nFetching data for ${firstName} ${lastName} (${patientId})`);

      if (glucoseMeasurement) {
        console.log(`Glucose Value: ${glucoseMeasurement.ValueInMgPerDl} mg/dL (${glucoseMeasurement.Value} mmol/L)`);
        console.log(`Trend Arrow: ${glucoseMeasurement.TrendArrow} - ${translateTrendArrow(glucoseMeasurement.TrendArrow)}`);
        console.log(`Timestamp: ${glucoseMeasurement.Timestamp}`);

        // Upload data to API
        await uploadToAPI(patientId, glucoseMeasurement);
      } else {
        console.log(`No glucose data available for this patient`);
      }
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
};

main().catch(console.error);