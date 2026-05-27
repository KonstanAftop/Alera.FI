import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Radio, MessageCircle, Copy, CheckCircle2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TELEGRAM_BOT_LINK, TELEGRAM_BOT_USERNAME } from "@/lib/telegramBot";

interface Props {
  activationCode: string;
  telegramLinked?: boolean;
  refreshUser: () => Promise<any>;
  onDismiss: () => void;
}

const TelegramConnectModal = ({ activationCode, telegramLinked, refreshUser, onDismiss }: Props) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(activationCode);
    setCopied(true);
    toast.success("Kode disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Polling status Telegram setiap 5 detik di background
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  // 2. Tutup modal secara otomatis ketika terdeteksi sukses terhubung
  useEffect(() => {
    if (telegramLinked) {
      toast.success("Akun Telegram berhasil terhubung!");
      const timer = setTimeout(() => {
        onDismiss();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [telegramLinked, onDismiss]);

  // 3. Jika kode aktivasi kosong, ambil/buat kode secara otomatis
  useEffect(() => {
    if (!activationCode) {
      refreshUser();
    }
  }, [activationCode, refreshUser]);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const updatedUser = await refreshUser();
      if (updatedUser?.telegramLinked) {
        // Sukses akan ditangani oleh useEffect auto-close
      } else {
        toast.error("Belum terdeteksi. Silakan kirim kode aktivasi ke bot terlebih dahulu.");
      }
    } catch (error) {
      toast.error("Gagal memverifikasi status. Silakan coba lagi.");
    } finally {
      setIsVerifying(false);
    }
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
              {activationCode ? (
                <>
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
                </>
              ) : (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Membuat kode aktivasi...</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
              Buka Telegram dan buka bot{" "}
              <a
                href={TELEGRAM_BOT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline font-medium inline-flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" /> {TELEGRAM_BOT_USERNAME}
              </a>
              .
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
              <span>
                Kirim perintah{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-foreground">/start</code>{" "}
                ke bot terlebih dahulu.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
              Kirim kode aktivasi di atas ke bot (bisa langsung paste).
            </p>
            <p className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">4</span>
              Bot akan memverifikasi dan mengaktifkan notifikasi Anda.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={onDismiss}
            disabled={isVerifying}
            className="flex-1 border border-border hover:bg-muted text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" /> Nanti Saja
          </Button>
          <Button 
            onClick={handleVerify} 
            disabled={isVerifying}
            className="flex-[2] bg-primary hover:bg-primary/90 font-bold"
          >
            {isVerifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isVerifying ? "Memverifikasi..." : "Saya Sudah Kirim"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramConnectModal;
