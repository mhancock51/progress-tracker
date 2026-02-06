import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

interface DateGroup {
  date: string;
  count: number;
  duration?: string;
  durationMinutes?: number;
  volume?: number;
  distance?: number;
}

export async function GET(request: Request) {
  try {
    // Get query parameters for year and month
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    
    const currentDate = new Date();
    const targetYear = yearParam ? parseInt(yearParam) : currentDate.getFullYear();
    const targetMonth = monthParam ? parseInt(monthParam) : currentDate.getMonth();
    
    // Get CSV file path from environment variable
    const csvFilePath = process.env.CSV_FILE_PATH;
    
    if (!csvFilePath) {
      return NextResponse.json(
        { error: 'CSV_FILE_PATH not configured in environment variables' },
        { status: 500 }
      );
    }

    // Resolve the path relative to project root
    const absolutePath = path.resolve(process.cwd(), csvFilePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { error: `CSV file not found at path: ${csvFilePath}` },
        { status: 404 }
      );
    }

    // Read the CSV file
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');

    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'Error parsing CSV file', details: parseResult.errors },
        { status: 500 }
      );
    }

    const data = parseResult.data as Record<string, string>[];

    // Find the date column (look for common date column names)
    const dateColumnNames = ['Date', 'date', 'DATE', 'created_at', 'timestamp', 'Timestamp'];
    const headers = parseResult.meta.fields || [];
    const dateColumn = headers.find(header => 
      dateColumnNames.includes(header)
    ) || headers[0]; // Default to first column if no date column found

    if (!dateColumn) {
      return NextResponse.json(
        { error: 'No columns found in CSV file' },
        { status: 400 }
      );
    }

    // Get max session duration from environment
    const maxSessionDurationHours = parseFloat(process.env.MAX_SESSION_DURATION_HOURS || '6');
    const maxSessionDurationMinutes = maxSessionDurationHours * 60;

    // Helper function to convert duration string to minutes
    const parseDuration = (duration: string): number => {
      // Handle formats like "1h 12m", "10m", "2h 53m"
      const hours = duration.match(/(\d+)h/);
      const minutes = duration.match(/(\d+)m/);
      let totalMinutes = 0;
      if (hours) totalMinutes += parseInt(hours[1]) * 60;
      if (minutes) totalMinutes += parseInt(minutes[1]);
      return totalMinutes;
    };

    // Group by date and count, also track durations and volume
    const dateGroupsMap = data.reduce((acc: Record<string, { count: number; durations: string[]; volume: number; distance: number; exercises: Set<string> }>, row) => {
      const dateValue = row[dateColumn];
      if (dateValue) {
        // Extract just the date part (YYYY-MM-DD) from datetime string
        const datePart = dateValue.trim().split(' ')[0];
        if (!acc[datePart]) {
          acc[datePart] = { count: 0, durations: [], volume: 0, distance: 0, exercises: new Set() };
        }
        acc[datePart].count += 1;
        
        // Calculate volume (weight * reps)
        const weight = parseFloat(row['Weight']) || 0;
        const reps = parseFloat(row['Reps']) || 0;
        acc[datePart].volume += weight * reps;
        
        // Track unique exercises
        const exerciseName = row['Exercise Name'];
        if (exerciseName) {
          acc[datePart].exercises.add(exerciseName);
        }
        
        // Track distance (in km or miles) - only for running exercises
        const exerciseNameLower = (exerciseName || '').toLowerCase();
        if (exerciseNameLower.includes('running')) {
          const distance = parseFloat(row['Distance']) || 0;
          acc[datePart].distance += distance;
        }
        
        // Track all unique durations for this date, but filter out invalid ones
        if (row['Duration'] && !acc[datePart].durations.includes(row['Duration'])) {
          const durationMinutes = parseDuration(row['Duration']);
          // Only include if duration is within valid range
          if (durationMinutes > 0 && durationMinutes <= maxSessionDurationMinutes) {
            acc[datePart].durations.push(row['Duration']);
          }
        }
      }
      return acc;
    }, {});

    // Calculate average duration
    let totalDurationMinutes = 0;
    let workoutsWithDuration = 0;

    // Convert to array and sort by date
    const groupedData: DateGroup[] = Object.entries(dateGroupsMap)
      .map(([date, info]) => {
        let duration: string | undefined;
        let durationMinutes: number | undefined;
        if (info.durations.length > 0) {
          // Take the maximum duration for this date (in case there are multiple workouts)
          const maxDurationMinutes = Math.max(...info.durations.map(parseDuration));
          if (maxDurationMinutes > 0) {
            // Convert back to readable format
            const hours = Math.floor(maxDurationMinutes / 60);
            const mins = maxDurationMinutes % 60;
            duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            durationMinutes = maxDurationMinutes;
            totalDurationMinutes += maxDurationMinutes;
            workoutsWithDuration += 1;
          }
        }
        return { date, count: info.count, duration, durationMinutes, volume: Math.round(info.volume), distance: parseFloat(info.distance.toFixed(2)) };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    
    // Get specified month's sessions for volume tracking
    const thisMonthSessions = groupedData
      .filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getFullYear() === targetYear && sessionDate.getMonth() === targetMonth;
      })
      .reverse(); // Oldest to newest for chart display

    // Calculate average duration for this month
    const thisMonthDurations = thisMonthSessions.filter(s => s.durationMinutes).map(s => s.durationMinutes!);
    const thisMonthAverageDuration = thisMonthDurations.length > 0
      ? Math.round(thisMonthDurations.reduce((sum, d) => sum + d, 0) / thisMonthDurations.length)
      : 0;

    // Calculate average duration for previous month
    const prevMonthDate = new Date(targetYear, targetMonth - 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();
    
    const prevMonthSessions = groupedData.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate.getFullYear() === prevYear && sessionDate.getMonth() === prevMonth;
    });
    
    const prevMonthDurations = prevMonthSessions.filter(s => s.durationMinutes).map(s => s.durationMinutes!);
    const prevMonthAverageDuration = prevMonthDurations.length > 0
      ? Math.round(prevMonthDurations.reduce((sum, d) => sum + d, 0) / prevMonthDurations.length)
      : 0;

    // Calculate average sets per workout for this month
    const thisMonthTotalSets = thisMonthSessions.reduce((sum, s) => sum + s.count, 0);
    const thisMonthAverageSets = thisMonthSessions.length > 0
      ? thisMonthTotalSets / thisMonthSessions.length
      : 0;

    // Calculate average sets per workout for previous month
    const prevMonthTotalSets = prevMonthSessions.reduce((sum, s) => sum + s.count, 0);
    const prevMonthAverageSets = prevMonthSessions.length > 0
      ? prevMonthTotalSets / prevMonthSessions.length
      : 0;

    // Calculate average cardio distance per session for this month
    const thisMonthSessionsWithDistance = thisMonthSessions.filter(s => s.distance && s.distance > 0);
    const thisMonthTotalDistance = thisMonthSessionsWithDistance.reduce((sum, s) => sum + (s.distance || 0), 0);
    const thisMonthAverageDistance = thisMonthSessionsWithDistance.length > 0
      ? thisMonthTotalDistance / thisMonthSessionsWithDistance.length
      : 0;

    // Calculate average cardio distance per session for previous month
    const prevMonthSessionsWithDistance = prevMonthSessions.filter(s => s.distance && s.distance > 0);
    const prevMonthTotalDistance = prevMonthSessionsWithDistance.reduce((sum, s) => sum + (s.distance || 0), 0);
    const prevMonthAverageDistance = prevMonthSessionsWithDistance.length > 0
      ? prevMonthTotalDistance / prevMonthSessionsWithDistance.length
      : 0;

    // Calculate average exercises per session for this month
    const thisMonthExerciseCounts = data
      .filter(row => {
        const dateValue = row[dateColumn];
        if (!dateValue) return false;
        const datePart = dateValue.trim().split(' ')[0];
        const sessionDate = new Date(datePart);
        return sessionDate.getFullYear() === targetYear && sessionDate.getMonth() === targetMonth;
      })
      .reduce((acc: Record<string, Set<string>>, row) => {
        const dateValue = row[dateColumn];
        const datePart = dateValue.trim().split(' ')[0];
        if (!acc[datePart]) {
          acc[datePart] = new Set();
        }
        const exerciseName = row['Exercise Name'];
        if (exerciseName) {
          acc[datePart].add(exerciseName);
        }
        return acc;
      }, {});

    const thisMonthExerciseCountsArray = Object.values(thisMonthExerciseCounts).map(set => set.size);
    const thisMonthAverageExercises = thisMonthExerciseCountsArray.length > 0
      ? thisMonthExerciseCountsArray.reduce((sum, count) => sum + count, 0) / thisMonthExerciseCountsArray.length
      : 0;

    // Calculate average exercises per session for previous month
    const prevMonthExerciseCounts = data
      .filter(row => {
        const dateValue = row[dateColumn];
        if (!dateValue) return false;
        const datePart = dateValue.trim().split(' ')[0];
        const sessionDate = new Date(datePart);
        return sessionDate.getFullYear() === prevYear && sessionDate.getMonth() === prevMonth;
      })
      .reduce((acc: Record<string, Set<string>>, row) => {
        const dateValue = row[dateColumn];
        const datePart = dateValue.trim().split(' ')[0];
        if (!acc[datePart]) {
          acc[datePart] = new Set();
        }
        const exerciseName = row['Exercise Name'];
        if (exerciseName) {
          acc[datePart].add(exerciseName);
        }
        return acc;
      }, {});

    const prevMonthExerciseCountsArray = Object.values(prevMonthExerciseCounts).map(set => set.size);
    const prevMonthAverageExercises = prevMonthExerciseCountsArray.length > 0
      ? prevMonthExerciseCountsArray.reduce((sum, count) => sum + count, 0) / prevMonthExerciseCountsArray.length
      : 0;

    // Calculate average reps per set for this month
    const thisMonthReps = data.filter(row => {
      const dateValue = row[dateColumn];
      if (!dateValue) return false;
      const datePart = dateValue.trim().split(' ')[0];
      const sessionDate = new Date(datePart);
      return sessionDate.getFullYear() === targetYear && sessionDate.getMonth() === targetMonth;
    });
    
    const thisMonthTotalReps = thisMonthReps.reduce((sum, row) => sum + (parseFloat(row['Reps']) || 0), 0);
    const thisMonthAverageReps = thisMonthReps.length > 0
      ? thisMonthTotalReps / thisMonthReps.length
      : 0;

    // Calculate average reps per set for previous month
    const prevMonthReps = data.filter(row => {
      const dateValue = row[dateColumn];
      if (!dateValue) return false;
      const datePart = dateValue.trim().split(' ')[0];
      const sessionDate = new Date(datePart);
      return sessionDate.getFullYear() === prevYear && sessionDate.getMonth() === prevMonth;
    });
    
    const prevMonthTotalReps = prevMonthReps.reduce((sum, row) => sum + (parseFloat(row['Reps']) || 0), 0);
    const prevMonthAverageReps = prevMonthReps.length > 0
      ? prevMonthTotalReps / prevMonthReps.length
      : 0;

    const averageDurationMinutes = workoutsWithDuration > 0 
      ? Math.round(totalDurationMinutes / workoutsWithDuration) 
      : 0;

    return NextResponse.json({
      success: true,
      dateColumn,
      totalGroups: groupedData.length,
      totalRows: data.length,
      averageDurationMinutes,
      thisMonthSessionCount: thisMonthSessions.length,
      thisMonthAverageDuration,
      prevMonthAverageDuration,
      thisMonthAverageSets,
      prevMonthAverageSets,
      thisMonthAverageDistance,
      prevMonthAverageDistance,
      thisMonthAverageExercises,
      prevMonthAverageExercises,
      thisMonthAverageReps,
      prevMonthAverageReps,
      weeklyGoal: parseInt(process.env.WEEKLY_WORKOUT_GOAL || '3'),
      volumeIncreaseGoal: parseFloat(process.env.VOLUME_INCREASE_GOAL || '5'),
      groups: groupedData,
      last10Sessions: thisMonthSessions,
    });

  } catch (error) {
    console.error('Error reading CSV file:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
