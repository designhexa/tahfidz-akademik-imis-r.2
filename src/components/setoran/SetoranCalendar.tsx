import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isBefore, isToday, startOfDay, addDays, subDays } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertCircle, Lock } from "lucide-react";

interface SetoranRecord {
  tanggal: Date;
  santriId: string;
  jenis: string;
  status: "selesai" | "tidak_hadir";
}

interface SetoranCalendarProps {
  santriId: string;
  setoranRecords: SetoranRecord[];
  onSelectDate: (date: Date | undefined) => void;
  selectedDate?: Date;
  allowPastFilling?: boolean;
}

export function SetoranCalendar({
  santriId,
  setoranRecords,
  onSelectDate,
  selectedDate,
  allowPastFilling = false,
}: SetoranCalendarProps) {
  const today = startOfDay(new Date());

  // Cari tanggal terakhir yang belum diisi (H-2)
  const getFirstMissingDate = useMemo(() => {
    if (allowPastFilling) return null;

    // Logic: check if H-2 is missing
    const targetDate = subDays(today, 2);
    const hasRecord = setoranRecords.some(
      (r) =>
        r.santriId === santriId &&
        format(r.tanggal, "yyyy-MM-dd") === format(targetDate, "yyyy-MM-dd")
    );

    return hasRecord ? null : targetDate;
  }, [setoranRecords, santriId, today, allowPastFilling]);

  // Cek apakah tanggal bisa dipilih
  const isDateSelectable = (date: Date): boolean => {
    const dateDay = startOfDay(date);
    const dateStr = format(date, "yyyy-MM-dd");
    
    // Tidak bisa pilih tanggal masa depan
    if (isBefore(today, dateDay)) return false;
    
    // Boleh pilih tanggal mana saja di masa lalu (backlog)
    if (allowPastFilling) return true;

    // Strict logic for non-backlog:
    if (getFirstMissingDate) {
      return format(getFirstMissingDate, "yyyy-MM-dd") === dateStr;
    }
    
    const todayHasRecord = setoranRecords.some(
      (r) =>
        r.santriId === santriId &&
        format(r.tanggal, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
    );
    
    if (todayHasRecord) return false;
    
    return isToday(date);
  };

  // Status setiap tanggal
  const getDateStatus = (date: Date): "selesai" | "tidak_hadir" | "kosong" | "locked" | "available" => {
    const dateStr = format(date, "yyyy-MM-dd");
    const record = setoranRecords.find(
      (r) =>
        r.santriId === santriId &&
        format(r.tanggal, "yyyy-MM-dd") === dateStr
    );
    
    if (record) {
      return record.status;
    }
    
    if (isBefore(today, startOfDay(date))) return "locked";
    
    if (isDateSelectable(date)) return "available";
    
    if (isBefore(startOfDay(date), today)) return "kosong";
    
    return "locked";
  };

  const modifiers = useMemo(() => {
    const selesai: Date[] = [];
    const tidakHadir: Date[] = [];
    const available: Date[] = [];
    const locked: Date[] = [];

    // Iterate 60 hari
    for (let i = -30; i <= 30; i++) {
      const date = addDays(today, i);
      const status = getDateStatus(date);
      
      switch (status) {
        case "selesai":
          selesai.push(date);
          break;
        case "tidak_hadir":
          tidakHadir.push(date);
          break;
        case "available":
          available.push(date);
          break;
        case "locked":
        case "kosong":
          locked.push(date);
          break;
      }
    }

    return { selesai, tidakHadir, available, locked };
  }, [setoranRecords, santriId, today, getFirstMissingDate]);

  const modifiersStyles = {
    selesai: {
      backgroundColor: "hsl(var(--primary))",
      color: "white",
      borderRadius: "50%",
    },
    tidakHadir: {
      backgroundColor: "hsl(var(--destructive))",
      color: "white",
      borderRadius: "50%",
    },
    available: {
      backgroundColor: "hsl(var(--secondary))",
      color: "hsl(var(--secondary-foreground))",
      borderRadius: "50%",
      fontWeight: "bold",
    },
    locked: {
      opacity: 0.4,
      cursor: "not-allowed",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          📅 Kalender Monitoring
        </CardTitle>
        <CardDescription>
          Pilih tanggal untuk menginput data setoran, drill, atau murojaah.
        </CardDescription>
      </CardHeader>
      <CardContent>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          disabled={(date) => !isDateSelectable(date)}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border"
        />

        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-primary" />
            <span>Sudah setor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-destructive" />
            <span>Tidak hadir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-secondary" />
            <span>Bisa diisi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span>Terkunci</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
