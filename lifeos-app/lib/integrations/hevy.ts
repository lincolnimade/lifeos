const HEVY_API_BASE = "https://api.hevyapp.com/v1";

export async function fetchHevyWorkouts(apiKey: string, page = 1, pageSize = 10) {
  const res = await fetch(`${HEVY_API_BASE}/workouts?page=${page}&pageSize=${pageSize}`, {
    headers: { "api-key": apiKey },
  });
  if (!res.ok) throw new Error(`Hevy fetch failed: ${res.status}`);
  return res.json() as Promise<{
    workouts: Array<{
      id: string;
      title: string;
      start_time: string;
      end_time: string;
      exercises: Array<{ title: string; sets: Array<{ weight_kg?: number; reps?: number }> }>;
    }>;
  }>;
}
