import UserSettingsDataManager from "@/lib/data-access/user-settings-manager";
import UserSettings from "@/types/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userSettings = await UserSettingsDataManager.getUserSettings();
  
    return NextResponse.json({
      userSettings,
    });
  }
  catch(error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const userSettings = body as UserSettings;

    await UserSettingsDataManager.createOrUpdateUserSettings(userSettings);
    return NextResponse.json(
      { success: true },
      { status: 200}
    )
  }
  catch(error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}