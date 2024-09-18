import 'dotenv/config';
import { LibreLinkClient } from 'libre-link-unofficial-api';

// Create a new LibreLinkClient instance.
//const client = new LibreLinkClient();
const client = new LibreLinkClient({ 
  email: process.env.LIBRE_LINK_EMAIL, 
  password: process.env.LIBRE_LINK_PASSWORD, 
  patientId: process.env.LIBRE_LINK_PATIENT_ID 
});


const login = async () => {
  //console.log("\n\nLog into the account =>\n");

  return await client.login();
};

const fetchConnections = async () => {
  console.log("\n\nFetched connections =>\n");

  return await client.fetchConnections();
}

const read = async () => {
  console.log("\n\nRead the data =>\n");

  return await client.read();
}

const fetchReading = async () => {
  console.log("\n\Fetch the reading =>\n");

  return await client.fetchReading();
}

const history = async () => {
  console.log("\n\Fetch the history =>\n");

  return await client.history();
}

// This is an example of how to use the LibreLinkClient class.
const main = async () => {
  console.clear();
  console.log('LIBRE_LINK_EMAIL ', process.env.LIBRE_LINK_EMAIL);
  console.log('LIBRE_LINK_PASSWORD ', process.env.LIBRE_LINK_PASSWORD);
  console.log('LIBRE_LINK_PATIENT_ID', process.env.LIBRE_LINK_PATIENT_ID);

  /** =============================
            Login example 
  =================================*/
  await login();

  // console.log(client.me);

  /** =============================
      Fetch connections example 
  =================================*/

   console.log(JSON.stringify(await fetchConnections(), null, 2));

  /** =============================
        Fetch reading example 
  =================================*/
  const reading = await read();

  // console.log("Reading =>", reading);
  // console.log("Raw Reading =>", JSON.stringify(reading._raw, null, 2));
  // console.log("mg/dL", reading.mgDl);
  // console.log("mmol", reading.mmol);
  // console.log("timestamp", reading.timestamp);
  // console.log("trend", reading.trend);
  // console.log("isHigh", reading.isHigh);
  // console.log("isLow", reading.isLow);
  // console.log("trendType", reading.trendType);
  // console.log("options", reading._options);

  /** =============================
    Fetch readings history example 
  =================================*/
  const readings = await history();

  // console.log(JSON.stringify(readings, null, 2));

  /** =============================
      Stream readings example 
  =================================*/

  // Stream the readings every 1.5 min
  for await (const reading of client.stream()) {
    const { value, timestamp, trendType } = reading;
    console.log("Stream reading =>", value, timestamp, trendType);
    console.log(value, " - ", timestamp.toTimeString());
    console.log((Math.round(value/1.8))/10, " - ", timestamp.toTimeString());
    console.log(`Trend ${trendType}`);
  }


  // Register the mock for the example URL.
  // mock("https://example.com/api/users/*", { data: { name: "Foo" } });

  // Make a fetch request to the mocked URL
  // const response = await fetch("https://example.com/api/users/123", { method: "POST" });

  // Print the response body
  // console.log(await response.json());
};

main();