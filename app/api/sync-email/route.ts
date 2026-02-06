import { NextResponse } from 'next/server';
import { fetchLatestCSVFromEmail } from '@/lib/gmail-service';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const senderEmail = process.env.AUTHORIZED_SENDER_EMAIL;
    
    if (!senderEmail) {
      return NextResponse.json(
        { success: false, error: 'AUTHORIZED_SENDER_EMAIL not configured' },
        { status: 500 }
      );
    }
    
    console.log('Fetching emails from:', senderEmail);
    const csvData = await fetchLatestCSVFromEmail(senderEmail);

    if (!csvData) {
      return NextResponse.json(
        { success: false, message: 'No CSV found in recent emails' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'CSV data synced successfully',
    });
  } catch (error) {
    console.error('Error syncing email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync email' },
      { status: 500 }
    );
  }
}