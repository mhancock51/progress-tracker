import UserSettings from "@/types/database";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  Id: "1",
  UserId: "1",
  Goals: {
    WeeklyWorkoutGoal: 3,
    VolumeIncreasePercentageGoal: 5,
    SessionLengthGoalInMinutes: 60
  },
  Filtering: {
    MaxSessionLengthInMinutes: 6 * 60
  }
}