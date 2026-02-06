import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

export async function getGmailClient() {
  const credentials = JSON.parse(
    await fs.readFile(CREDENTIALS_PATH, 'utf-8')
  );
  
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    const token = await fs.readFile(TOKEN_PATH, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (error) {
    throw new Error('Token not found. Run authorization flow first.');
  }

  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

export async function fetchLatestCSVFromEmail(
  senderEmail: string
): Promise<string | null> {
  const gmail = await getGmailClient();

  // search for emails from user with csv - try broader search
  const query = `from:${senderEmail} has:attachment`;
  console.log('Searching with query:', query);
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 10,
  });

  const messages = response.data.messages;
  console.log('Found messages:', messages?.length || 0);
  
  if (!messages || messages.length === 0) {
    console.log('No messages found with attachments from:', senderEmail);
    return null;
  }

  // Check all messages for CSV attachments
  for (const msg of messages) {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
    });

    // Find CSV attachment
    const parts = message.data.payload?.parts || [];
    console.log('Message has', parts.length, 'parts');
    
    for (const part of parts) {
      console.log('Part filename:', part.filename, 'has attachment:', !!part.body?.attachmentId);
      
      if (
        part.filename?.endsWith('.csv') &&
        part.body?.attachmentId
      ) {
        console.log('Found CSV attachment:', part.filename);
        
        const attachment = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: msg.id!,
          id: part.body.attachmentId,
        });

        // Decode base64 data
        const data = Buffer.from(
          attachment.data.data!,
          'base64'
        ).toString('utf-8');

        // Save to file - try multiple times if file is locked
        const csvPath = path.join(process.cwd(), 'data', 'strong_workouts.csv');
        const maxRetries = 3;
        
        for (let i = 0; i < maxRetries; i++) {
          try {
            await fs.writeFile(csvPath, data);
            console.log('✓ CSV saved to:', csvPath);
            return data;
          } catch (error: any) {
            if (error.code === 'EBUSY' && i < maxRetries - 1) {
              console.log(`File is locked, retrying in 1 second... (${i + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              throw error;
            }
          }
        }

        return data;
      }
    }
  }
  
  console.log('No CSV attachments found in any messages');
  return null;
}