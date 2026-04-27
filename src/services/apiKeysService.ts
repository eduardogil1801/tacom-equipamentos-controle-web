import { YTStudioSettings, DEFAULT_YT_SETTINGS } from '@/types/youtubeStudio';

const STORAGE_KEY = 'yt_studio_settings';

export function getYTSettings(): YTStudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_YT_SETTINGS };
    return { ...DEFAULT_YT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_YT_SETTINGS };
  }
}

export function saveYTSettings(settings: YTStudioSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
