import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function authorize() {
  const credentials = JSON.parse(
    await fs.readFile(CREDENTIALS_PATH, 'utf-8')
  );
  
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we already have a token
  try {
    const token = await fs.readFile(TOKEN_PATH, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(token));
    console.log('✓ Already authorized');
    return oAuth2Client;
  } catch (error) {
    // Get new token
    return getNewToken(oAuth2Client);
  }
}

async function getNewToken(oAuth2Client: any) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        console.log('✓ Token stored to', TOKEN_PATH);
        resolve(oAuth2Client);
      } catch (err) {
        console.error('Error retrieving access token', err);
        reject(err);
      }
    });
  });
}

async function triggerSync() {
  try {
    const response = await fetch('http://localhost:3000/api/sync-email', {
      method: 'POST',
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✓', result.message);
    } else {
      console.error('✗ Sync failed:', result.message || result.error);
      console.error('Full response:', JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Error triggering sync:');
    console.error(error);
    console.error('\nIs your dev server running? Start it with: npm run dev');
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  if (command === 'auth') {
    console.log('Starting authorization...\n');
    await authorize();
    console.log('\n✓ Authorization complete!');
  } else if (command === 'sync') {
    console.log('Triggering email sync...\n');
    await triggerSync();
  } else if (command === 'full') {
    console.log('Starting full authorization and sync...\n');
    await authorize();
    console.log('\n✓ Authorization complete!');
    console.log('\nTriggering email sync...\n');
    await triggerSync();
  } else {
    console.log('Usage:');
    console.log('  npm run gmail auth  - Authorize Gmail API access');
    console.log('  npm run gmail sync  - Trigger email sync');
    console.log('  npm run gmail full  - Auth + sync in one command');
    process.exit(1);
  }
}

main().catch(console.error);
