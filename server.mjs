import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { exec } from 'child_process';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

let patientData = [];

const runScriptAndFetchData = () => {
  exec('node app.mjs', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing app.mjs: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    
    console.log(`stdout from app.mjs: ${stdout}`);
    
    try {
      // Parse the JSON output from app.mjs
      patientData = JSON.parse(stdout);
      console.log("Parsed patient data:", patientData); // Log the parsed patient data
    } catch (parseError) {
      console.error(`Error parsing JSON: ${parseError.message}`);
    }
  });
};


// Run the script immediately when the server starts
runScriptAndFetchData();

// Schedule the cron job to run every 5 minutes
cron.schedule('0,5,10,15,20,25,30,35,40,45,50,55 * * * *', () => {
  runScriptAndFetchData();
});

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'libre-monitor.html'));
});

// API to serve patient data
app.get('/patient-data', (req, res) => {
  res.json(patientData);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
