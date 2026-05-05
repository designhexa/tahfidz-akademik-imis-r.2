import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface JuzSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  required?: boolean;
  /** "asc" = 1→30, "desc" = 30→1. Default: "desc" (for hafalan) */
  order?: "asc" | "desc";
  /** Bila diset, hanya juz ini yang boleh dipilih (dikunci). */
  lockedJuz?: number;
}

export const JuzSelector = ({
  value,
  onValueChange,
  label = "Juz",
  required = false,
  order = "desc",
  lockedJuz,
}: JuzSelectorProps) => {
  const [open, setOpen] = useState(false);

  // Sinkronkan otomatis bila terkunci
  useEffect(() => {
    if (lockedJuz !== undefined && value !== String(lockedJuz)) {
      onValueChange(String(lockedJuz));
    }
  }, [lockedJuz, value, onValueChange]);

  const handleSelect = (juz: string) => {
    if (lockedJuz !== undefined && Number(juz) !== lockedJuz) return;
    onValueChange(juz);
    setOpen(false);
  };

  if (lockedJuz !== undefined) {
    return (
      <div className="space-y-2">
        <Label>{label}{required && " *"}</Label>
        <Button
          variant="outline"
          disabled
          className="w-full justify-between opacity-100 cursor-not-allowed"
        >
          <span>Juz {lockedJuz} (terkunci - juz aktif santri)</span>
          <Lock className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}{required && " *"}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value ? value : "Pilih juz"}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-2" align="start">
          <div className="grid grid-cols-6 gap-1">
            {(order === "desc"
              ? Array.from({ length: 30 }, (_, i) => 30 - i)
              : Array.from({ length: 30 }, (_, i) => i + 1)
            ).map((juz) => (
              <Button
                key={juz}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 w-full font-medium",
                  value === String(juz) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                )}
                onClick={() => handleSelect(String(juz))}
              >
                {value === String(juz) && <Check className="h-3 w-3 mr-1" />}
                {juz}
              </Button>
            ))}
          </div>
          {value && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Menampilkan surah dalam Juz {value}
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
