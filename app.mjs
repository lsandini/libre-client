import 'dotenv/config';
import { LibreLinkClient } from 'libre-link-unofficial-api';
import fetch from 'node-fetch';

// Translate trend arrow to match previous implementation
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

// Generate API URL for Nightscout
const generateApiUrl = (index) => `https://ns-${index + 11}.oracle.cgmsim.com/api/v1/entries`;

// Upload glucose data to Nightscout
const uploadToAPI = async (patientId, glucoseData, apiUrl) => {
    const api_key = process.env.API_KEY;
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

// Main function to process LibreLink connections
const main = async () => {
    try {
        // Initialize LibreLink client with credentials from environment
        const client = new LibreLinkClient({ 
            email: process.env.LIBRE_LINK_EMAIL, 
            password: process.env.LIBRE_LINK_PASSWORD 
        });

        // Login to LibreLink
        const loginResponse = await client.login();
        console.error("Logged in successfully");

        // Debug: Log user information
        const user = client.me;
        console.error("User Information:", JSON.stringify(user, null, 2));

        // Check login response details
        console.error("Login Response:", JSON.stringify(loginResponse, null, 2));

        // Fetch connections
        const connectionsResponse = await client.fetchConnections();
        console.error("Fetched connections");

        // Store patient information
        const patients = [];

        // Process each connection
        for (const [index, connection] of connectionsResponse.data.entries()) {
            const { patientId, firstName, lastName, glucoseMeasurement } = connection;
            const apiUrl = generateApiUrl(index);

            // Collect patient data
            patients.push({
                firstName: firstName,
                lastName: lastName,
                glucose: glucoseMeasurement ? glucoseMeasurement.ValueInMgPerDl : 'N/A',
            });

            console.error(`Processing data for ${firstName} ${lastName} (${patientId})`);
            console.error(`API URL: ${apiUrl}`);

            // Upload glucose data if available
            if (glucoseMeasurement) {
                await uploadToAPI(patientId, glucoseMeasurement, apiUrl);
            } else {
                console.error(`No glucose measurement available for patient ${patientId}`);
            }
        }

        // Output patient data as JSON
        console.log(JSON.stringify(patients, null, 2));
        console.error("Output patient data as JSON");

    } catch (error) {
        console.error("An error occurred:", error.message);
        process.exit(1);
    }
};

// Execute the main function
main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});