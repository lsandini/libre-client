import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { exec } from 'child_process';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'libre-monitor.html'));
});

// Schedule the cron job to run every hour (adjust as needed)
cron.schedule('0,5,10,15,20,25,30,35,40,45,50,55 * * * *', () => {
  exec('node app.mjs', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing app.mjs: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
