const { google } = require('googleapis');
const path = require('path');
const { promises: fs } = require('fs');
const { authenticate } = require('@google-cloud/local-auth');

// Scopes used by the app
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'token.json');

/**
 * Reads a JSON file.
 */
async function readJson(filePath) {
  try {
    const content = await fs.readFile(filePath);
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * Authorize a client with credentials, then call the Google Drive API.
 */
async function authorize() {
  // First, try to load credentials from the environment variable (for Vercel)
  if (process.env.GOOGLE_TOKEN) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_TOKEN);
      const client = new google.auth.OAuth2(parsed.client_id, parsed.client_secret);
      client.setCredentials({ refresh_token: parsed.refresh_token });
      return client;
    } catch (e) {
      console.warn('Could not parse GOOGLE_TOKEN env var.', e);
      // fallback to local flow
    }
  }

  // Second, try to load the saved token from token.json
  try {
    const token = await readJson(TOKEN_PATH);
    if (token && token.refresh_token) {
      const creds = await readJson(CREDENTIALS_PATH);
      if (creds) {
        const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
        const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        client.setCredentials(token);
        return client;
      }
    }
  } catch (err) {
    console.log('No local token found, or it is invalid.');
  }

  // Third, if no token, authenticate using local-auth flow
  try {
    const client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      // Save the new token
      await fs.writeFile(TOKEN_PATH, JSON.stringify(client.credentials, null, 2));
      console.log('New token saved to', TOKEN_PATH);
    }
    return client;
  } catch (err) {
    console.error('Local authentication failed.', err);
    throw new Error('Could not authenticate. Ensure credentials.json is in the `backend` directory and that you can open a browser for the OAuth flow.');
  }
}

module.exports = { authorize, SCOPES };