import { useState, useEffect } from "react";
import { type CalendarEntry } from "@/components/setoran/CalendarCell";

const STORAGE_KEY = "setoran_calendar_entries";
const STORAGE_VERSION_KEY = "setoran_calendar_entries_version";
const CURRENT_VERSION = "v2-no-mock";

// Helper to revive dates from JSON
const reviveDates = (data: CalendarEntry[]): CalendarEntry[] => {
  return data.map((entry) => ({
    ...entry,
    tanggal: new Date(entry.tanggal),
  }));
};

export const useSetoranPersistence = () => {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial load
  useEffect(() => {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (version !== CURRENT_VERSION) {
      // Bersihkan data mock lama agar pengguna mulai dari nol
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      setEntries([]);
      setIsLoaded(true);
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEntries(reviveDates(parsed));
      } catch (e) {
        console.error("Failed to parse saved entries", e);
        setEntries([]);
      }
    } else {
      setEntries([]);
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
