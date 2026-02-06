export type UserSettings = {
  id: string;
  user_id: string;
  goals: {
    WeeklyWorkoutGoal: number;
    VolumeIncreasePercentageGoal: number;
    SessionLengthGoalInMinutes: number;
  };
  filtering: {
    MaxSessionLengthInMinutes: number;
  };
}

export default UserSettings;