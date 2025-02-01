import 'dotenv/config';
import { LibreLinkClient } from 'libre-link-unofficial-api';
import fetch from 'node-fetch';
import crypto from 'crypto';

class ExtendedLibreLinkClient {
    constructor(options) {
        this.email = options.email.trim();
        this.password = options.password.trim();
        this.libreLinkUpId = null;
        this.region = 'eu'; // Explicitly set to 'eu'
        this.authToken = null;
        
        if (!this.email || !this.password) {
            throw new Error('Email and password are required');
        }
        console.error('Client initialized with email:', this.email);
    }

    _calculateHash(str = '') {
        return crypto.createHash('sha256').update(str).digest('hex');
    }

    async _makeRequest(endpoint, options = {}) {
        const url = this._getUrl(endpoint);
        console.error(`Request URL: ${url}`);

        const headers = {
            'accept-encoding': 'gzip',
            'cache-control': 'no-cache',
            'connection': 'keep-alive',
            'content-type': 'application/json',
            'product': 'llu.ios',
            'version': process.env.LIBRE_LINK_UP_VERSION,
            'account-id': this._calculateHash(this.libreLinkUpId || '')
        };

        if (this.authToken && endpoint !== 'auth/login') {
            headers['authorization'] = `Bearer ${this.authToken}`;
        }

        const finalOptions = {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            }
        };

        console.error('Final Headers:', JSON.stringify(finalOptions.headers, null, 2));
        if (finalOptions.body) {
            console.error('Request Body:', finalOptions.body);
        }

        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();
            console.error('Response:', JSON.stringify(data, null, 2));

            // Simplified login handling, remove region switching logic
            if (endpoint === 'auth/login') {
                if (data?.data?.user?.id) {
                    this.libreLinkUpId = data.data.user.id;
                    this.authToken = data.data?.authTicket?.token;
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(data)}`);
            }

            return data;
        } catch (error) {
            console.error('Error in request:', error);
            throw error;
        }
    }

    _getUrl(endpoint) {
        const base = 'https://api-eu.libreview.io';
        const cleanEndpoint = endpoint.startsWith('llu/') ? endpoint.slice(4) : endpoint;
        return `${base}/llu/${cleanEndpoint}`;
    }

    async login() {
        console.error('Attempting login for:', this.email);
        const loginData = {
            email: this.email,
            password: this.password
        };

        const response = await this._makeRequest('auth/login', {
            method: 'POST',
            body: JSON.stringify(loginData)
        });

        return response;
    }

    async fetchConnections() {
        if (!this.authToken || !this.libreLinkUpId) {
            throw new Error('Must login successfully before fetching connections');
        }
        return this._makeRequest('connections', {
            method: 'GET'
        });
    }
}

// Initialize client with environment variables
const client = new ExtendedLibreLinkClient({ 
    email: process.env.LIBRE_LINK_EMAIL.trim(),
    password: process.env.LIBRE_LINK_PASSWORD.trim()
});

const api_key = process.env.API_KEY;

const generateApiUrl = (index) => `https://ns-${index + 11}.oracle.cgmsim.com/api/v1/entries`;

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
    try {
        const loginResponse = await client.login();
        console.error("Logged in successfully");

        const connections = await client.fetchConnections();
        console.error("Fetched connections");

        const patients = [];

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

        console.log(JSON.stringify(patients, null, 2));
        console.error("Output patient data as JSON");

    } catch (error) {
        console.error("An error occurred:", error.message);
        process.exit(1);
    }
};

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});