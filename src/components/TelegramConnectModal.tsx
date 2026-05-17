import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Radio, MessageCircle, Copy, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  activationCode: string;
  onDismiss: () => void;
}

const TelegramConnectModal = ({ activationCode, onDismiss }: Props) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(activationCode);
    setCopied(true);
    toast.success("Kode disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-border bg-card/95 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Radio className="h-5 w-5 text-primary" /> Aktivasi Telegram
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Sambungkan akun Telegram untuk menerima peringatan dini banjir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Kode Aktivasi Anda</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-[0.15em] text-primary">
                {activationCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={copyCode}
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
              Buka Telegram dan cari bot{" "}
              <a
                href="https://t.me/AleraFIBot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline font-medium inline-flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" /> @AleraFIBot
              </a>
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
              Kirim kode aktivasi di atas ke bot (bisa langsung paste).
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
              Bot akan memverifikasi dan mengaktifkan notifikasi Anda.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="flex-1 border border-border hover:bg-muted text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" /> Nanti Saja
          </Button>
          <Button onClick={onDismiss} className="flex-[2] bg-primary hover:bg-primary/90 font-bold">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Saya Sudah Kirim
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramConnectModal;
