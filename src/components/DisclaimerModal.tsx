import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Database, CheckCircle2, Info, ExternalLink } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DISCLAIMER_STORAGE_KEY = "alera_disclaimer_dismissed_v1";

const DisclaimerModal = ({ open, onOpenChange }: Props) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
      setDontShowAgain(stored === "true");
    }
  }, [open]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    }
    onOpenChange(false);
  };

  const instansiList = [
    { name: "FFWS KOICA", url: "https://ffws-bbwscitarum.id" },
    { name: "HKA BBWS Citarum", url: "https://hkabbwscitarum.higertech.com" },
    { name: "Jaga Balai", url: "https://jagabalai.higertech.com" },
    { name: "BPBD Kabupaten Bandung", url: "https://bpbdkabbandung.higertech.com" },
    { name: "BMKG", url: "https://www.bmkg.go.id" },
    { name: "inaRISK BNPB", url: "https://inarisk.bnpb.go.id" },
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl border-border bg-card/95 backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-primary" /> Disclaimer
          </div>
          <DialogTitle className="text-xl font-bold leading-tight text-foreground">
            Platform Pemantauan Hidrometeorologi dan Informasi Kewaspadaan Banjir DAS Citarum
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Platform ini dikembangkan sebagai sarana pemantauan hidrometeorologi dan penyedia informasi kewaspadaan banjir di wilayah DAS Citarum dalam kerangka riset dan edukasi masyarakat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Sumber Data Resmi */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2.5">
            <h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" /> Sumber Data Resmi & Integrasi Informasi
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <strong className="text-foreground">Stasiun Telemetri Sungai & Curah Hujan (ARR/AWLR):</strong> Diperoleh dari stasiun pemantauan terintegrasi FFWS KOICA, Jaga Balai, HKA BBWS Citarum, dan BPBD Kabupaten Bandung yang tersebar di wilayah DAS Citarum.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <strong className="text-foreground">Ambang Batas & Klasifikasi Status:</strong> Mengacu pada kriteria dan penetapan indikator resmi dari FFWS KOICA, BPBD untuk tinggi muka air, serta BMKG untuk klasifikasi intensitas curah hujan.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <strong className="text-foreground">Data Risiko Kebencanaan:</strong> Mengintegrasikan peta risiko banjir dari inaRISK (BNPB).
                </span>
              </li>
            </ul>
          </div>

          {/* Kotak Peringatan & Rujukan Resmi */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <Info className="h-4 w-4 shrink-0" /> INFORMASI RUJUKAN RESMI DATA
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed font-normal">
              Seluruh indikator, status, dan visualisasi pemantauan pada platform AleraFI disajikan dengan <strong>merujuk langsung pada data publik yang dikeluarkan oleh instansi resmi</strong>, yaitu:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {instansiList.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 p-2.5 text-xs hover:border-primary/50 hover:bg-muted/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.name}</div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
                        {item.url.replace("https://", "")}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-blue-500/20">
              Platform ini berfungsi memadukan data resmi dari instansi-instansi tersebut secara terintegrasi untuk mendukung kesiapsiagaan dan informasi kewaspadaan banjir masyarakat di wilayah DAS Citarum.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border mt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-center">
            <Checkbox
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(Boolean(checked))}
            />
            <span className="text-xs text-muted-foreground">Jangan tampilkan lagi saat masuk</span>
          </label>

          <Button
            onClick={handleClose}
            className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Saya Mengerti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DisclaimerModal;
