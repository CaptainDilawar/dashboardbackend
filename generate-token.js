const path = require('path');
const { authenticate } = require('@google-cloud/local-auth');
const { promises: fs } = require('fs');
const { SCOPES } = require('./api/_helpers');

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

/**
 *  Uses @google-cloud/local-auth to perform a local OAuth 2.0 flow,
 *  then prints the necessary JSON payload to be used as an environment
 *  variable on a hosting platform like Vercel or Railway.
 */
async function generateToken() {
  console.log('Attempting to generate a new Google OAuth token...');

  try {
    // Check if credentials file exists
    await fs.access(CREDENTIALS_PATH);
  } catch (e) {
    console.error(`Error: credentials.json not found at ${CREDENTIALS_PATH}`);
    console.error('Please ensure your OAuth 2.0 client ID credentials file is saved as "credentials.json" in the "backend" directory before running this script.');
    process.exit(1);
  }

  console.log('Please complete the authentication flow in the browser window that opens.');

  try {
    const client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });

    if (client.credentials && client.credentials.refresh_token) {
      // Prepare the minimal payload for the environment variable
      const envVarPayload = {
        client_id: client._clientId,
        client_secret: client._clientSecret,
        refresh_token: client.credentials.refresh_token
      };

      console.log('\n✅ Token generation successful!');
      console.log('\n--- COPY THE FOLLOWING JSON ---');
      console.log('Copy the entire JSON object below and set it as the value for the `GOOGLE_TOKEN` environment variable in your Railway project settings.\n');
      console.log(JSON.stringify(envVarPayload, null, 2));
      console.log('\n--- END OF JSON ---\n');

    } else {
      console.error('\nError: Failed to obtain a refresh token.');
      console.error('During the Google consent flow, you must grant the application "offline" access to get a refresh token.');
      console.error('Please try running the script again.');
    }
  } catch (error) {
    console.error('\nAn error occurred during the authentication process:', error.message);
    console.error('This can happen if you close the browser window prematurely or if there is a problem with your `credentials.json` file.');
  }
}

generateToken().catch(console.error);
