"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserSettings from "@/types/database";
import axios from "axios";
import { Settings } from "lucide-react";
import { useState } from "react";

export function UserSettingsDialog() {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const getData = async() => {
    const response = await axios.get("/api/user-settings");
    setUserSettings(response.data.userSettings);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSettings) return;

    setSaving(true);
    try {
      await axios.put("/api/user-settings", userSettings);
      setOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      // Optionally show error message
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) void getData();
      }}
    >
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="absolute right-0"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your workout goals and preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {userSettings ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50">Goals</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="weeklyGoal">Weekly Workout Goal</Label>
                  <Input
                    id="weeklyGoal"
                    type="number"
                    min={1}
                    max={7}
                    defaultValue={userSettings.goals.WeeklyWorkoutGoal}
                    onChange={(e) => setUserSettings({
                      ...userSettings,
                      goals: { ...userSettings.goals, WeeklyWorkoutGoal: Number(e.target.value) }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volumeGoal">Volume Increase Goal (%)</Label>
                  <Input
                    id="volumeGoal"
                    type="number"
                    defaultValue={userSettings.goals.VolumeIncreasePercentageGoal}
                    onChange={(e) => setUserSettings({
                      ...userSettings,
                      goals: { ...userSettings.goals, VolumeIncreasePercentageGoal: Number(e.target.value) }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionLength">Session Length Goal (minutes)</Label>
                  <Input
                    id="sessionLength"
                    type="number"
                    defaultValue={userSettings.goals.SessionLengthGoalInMinutes}
                    onChange={(e) => setUserSettings({
                      ...userSettings,
                      goals: { ...userSettings.goals, SessionLengthGoalInMinutes: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50">Filtering</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="maxSession">Max Session Length (minutes)</Label>
                  <Input
                    id="maxSession"
                    type="number"
                    defaultValue={userSettings.filtering.MaxSessionLengthInMinutes}
                    onChange={(e) => setUserSettings({
                      ...userSettings,
                      filtering: { ...userSettings.filtering, MaxSessionLengthInMinutes: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading settings...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
