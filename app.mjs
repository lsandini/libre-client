import 'dotenv/config';
import { LibreLinkClient } from 'libre-link-unofficial-api';
import fetch from 'node-fetch';

// Create a new LibreLinkClient instance
const client = new LibreLinkClient({ 
  email: process.env.LIBRE_LINK_EMAIL, 
  password: process.env.LIBRE_LINK_PASSWORD 
});

const api_key = process.env.API_KEY;

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

  console.error(`Preparing to upload data for patient ${patientId} to ${apiUrl}:`, JSON.stringify(body));

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    console.error(`Data uploaded successfully for patient ${patientId} to ${apiUrl}`);
  } catch (error) {
    console.error(`Error uploading data for patient ${patientId}: ${error.message}`);
  }
};

const main = async () => {
  const patients = [];

  try {
    await login();
    console.error("Logged in successfully");

    const connections = await fetchConnections();
    console.error("Fetched connections");

    for (const [index, connection] of connections.data.entries()) {
      const { patientId, firstName, lastName, glucoseMeasurement } = connection;
      const apiUrl = generateApiUrl(index);

      patients.push({
        firstName: firstName,
        lastName: lastName,
        glucose: glucoseMeasurement ? glucoseMeasurement.ValueInMgPerDl : 'N/A',
      });

      console.error(`Processing data for ${firstName} ${lastName} (${patientId})`);
      console.error(`API URL: ${apiUrl}`);

      if (glucoseMeasurement) {
        await uploadToAPI(patientId, glucoseMeasurement, apiUrl);
      } else {
        console.error(`No glucose measurement available for patient ${patientId}`);
      }
    }

    // Output the collected patient data as JSON
    console.log(JSON.stringify(patients, null, 2));
    console.error("Output patient data as JSON");

  } catch (error) {
    console.error("An error occurred:", error.message);
  }
};

main().catch(console.error);
