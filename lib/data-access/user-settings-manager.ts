// allow for creation/update of user settings

import UserSettings from "@/types/database";
import { supabase } from "../supabase-client";

const TABLE_NAME = "user_settings";

export async function getUserSettings() {
  const query = supabase
    .from(TABLE_NAME)
    .select("*")
    .single();
  
  // fetch data
  const { data, error } = await query;
  if (error) throw new Error(error.message)
    return data as UserSettings
}

export async function createOrUpdateUserSettings(userSettings: UserSettings) {
  if (userSettings.UserId === "")
    throw new Error("user id wasn't set")

  const query = supabase
    .from(TABLE_NAME)
    .upsert(
      userSettings
    )
    .select()
    .single();

  // fetch data
  const { data, error } = await query;
  if (error) throw new Error(error.message)
    return data as UserSettings
}

const UserSettingsDataManager = {
  getUserSettings,
  createOrUpdateUserSettings
}

export default UserSettingsDataManager;