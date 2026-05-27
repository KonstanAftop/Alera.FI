import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

export const GEOCODING_SUFFIX = " Bandung";

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationGeocodeSearchProps {
  value: string;
  onChange: (location: string) => void;
  disabled?: boolean;
}

const LocationGeocodeSearch = ({ value, onChange, disabled }: LocationGeocodeSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/geocoding/search?q=${encodeURIComponent(q + GEOCODING_SUFFIX)}`,
      );
      if (!res.ok) throw new Error("Gagal mencari lokasi");
      const data: NominatimResult[] = await res.json();
      setResults(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        toast.message("Lokasi tidak ditemukan", {
          description: "Coba kata kunci lain atau perjelas alamat.",
        });
      }
    } catch {
      toast.error("Gagal mencari lokasi");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectResult = (res: NominatimResult) => {
    onChange(res.display_name);
    setResults([]);
    setSearchQuery("");
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Cari alamat</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                isSearching ? "animate-pulse text-primary" : "text-muted-foreground"
              }`}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              placeholder="Ketik nama jalan, kampung, atau tempat…"
              className="pl-9"
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSearch}
            disabled={disabled || isSearching || !searchQuery.trim()}
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="overflow-hidden rounded-lg border bg-popover shadow-md">
            <div className="max-h-[200px] overflow-y-auto">
              {results.map((res) => (
                <button
                  key={res.place_id}
                  type="button"
                  onClick={() => selectResult(res)}
                  className="flex w-full flex-col gap-0.5 border-b px-3 py-2.5 text-left last:border-0 hover:bg-muted/50"
                >
                  <span className="line-clamp-1 text-xs font-medium">
                    {res.display_name.split(",")[0]}
                  </span>
                  <span className="line-clamp-2 text-[11px] text-muted-foreground">
                    {res.display_name}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setResults([])}
              className="w-full py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground hover:bg-muted/30"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Lokasi terpilih *</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pilih dari hasil pencarian atau ketik manual"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default LocationGeocodeSearch;
