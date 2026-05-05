import { useState, useEffect } from "react";
import { type CalendarEntry } from "@/components/setoran/CalendarCell";

const STORAGE_KEY = "setoran_calendar_entries";

// Helper to revive dates from JSON
const reviveDates = (data: CalendarEntry[]): CalendarEntry[] => {
  return data.map((entry) => ({
    ...entry,
    tanggal: new Date(entry.tanggal),
  }));
};

const INITIAL_MOCK_ENTRIES: CalendarEntry[] = [];

export const useSetoranPersistence = () => {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEntries(reviveDates(parsed));
      } catch (e) {
        console.error("Failed to parse saved entries", e);
        setEntries(INITIAL_MOCK_ENTRIES);
      }
    } else {
      setEntries(INITIAL_MOCK_ENTRIES);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  const addEntries = (newEntries: CalendarEntry | CalendarEntry[]) => {
    const toAdd = Array.isArray(newEntries) ? newEntries : [newEntries];
    setEntries((prev) => [...prev, ...toAdd]);
  };

  const deleteEntry = (entryToDelete: CalendarEntry) => {
    setEntries((prev) =>
      prev.filter(
        (e) =>
          !(
            e.tanggal.getTime() === entryToDelete.tanggal.getTime() &&
            e.santriId === entryToDelete.santriId &&
            e.jenis === entryToDelete.jenis &&
            e.juz === entryToDelete.juz &&
            e.surah === entryToDelete.surah &&
            e.halaman === entryToDelete.halaman &&
            e.ayat === entryToDelete.ayat
          )
      )
    );
  };

  return {
    entries,
    addEntries,
    deleteEntry,
    isLoaded,
  };
};
