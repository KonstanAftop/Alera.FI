import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle, Copy, CheckCircle2, Link2, Unlink, Send,
  Radio, Loader2, RefreshCw, AlertTriangle, Bot, Bell,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { TELEGRAM_BOT_LINK, TELEGRAM_BOT_USERNAME } from "@/lib/telegramBot";

interface TelegramGroup {
  groupId: string;
  groupTitle: string;
  linkedAt: string;
  isActive: boolean;
}

interface TelegramStatusResponse {
  status: string;
  data?: {
    telegram_group_id?: string | null;
    telegram_group_title?: string | null;
    telegram_linked_at?: string | null;
  };
}

const CommunityTelegramPage = () => {
  const { user, refreshUser } = useAuth();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkedGroup, setLinkedGroup] = useState<TelegramGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoAlertEnabled, setAutoAlertEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);

  const applyLinkStatus = async (data?: TelegramStatusResponse["data"]) => {
    if (data?.telegram_group_id) {
      setLinkedGroup({
        groupId: data.telegram_group_id,
        groupTitle: data.telegram_group_title || `Group ${data.telegram_group_id}`,
        linkedAt: data.telegram_linked_at || new Date().toISOString(),
        isActive: true,
      });
      setLinkCode(null);
      await refreshUser();
      return true;
    }
    return false;
  };

  // Fetch current Telegram link status
  useEffect(() => {
    const fetchLinkStatus = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const response = await fetchApi<TelegramStatusResponse>(
          `/api/community/telegram-status?user_id=${user.id}`,
        );

        if (response.status !== "success") {
          console.error("Error fetching community profile:", response);
          return;
        }

        await applyLinkStatus(response.data);
      } catch (err) {
        console.error("Failed to fetch Telegram status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkStatus();
  }, [user?.id]);

  // Poll while waiting for /link in Telegram group
  useEffect(() => {
    if (!user?.id || linkedGroup || !linkCode) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetchApi<TelegramStatusResponse>(
          `/api/community/telegram-status?user_id=${user.id}`,
        );
        if (response.status === "success" && response.data?.telegram_group_id) {
          await applyLinkStatus(response.data);
          toast.success("Group Telegram berhasil terhubung!");
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.id, linkedGroup, linkCode]);

  // Fetch auto alert status when group is linked
  useEffect(() => {
    const fetchAutoAlertStatus = async () => {
      if (!user?.id || !linkedGroup) return;
      try {
        const response = await fetchApi<{ status: string; auto_alert_enabled?: boolean }>(
          `/telegram/auto-alert-status?user_id=${user.id}`,
        );
        if (response.status === "success") {
          setAutoAlertEnabled(response.auto_alert_enabled || false);
        }
      } catch (err) {
        console.error("Failed to fetch auto alert status:", err);
      }
    };

    fetchAutoAlertStatus();
  }, [user?.id, linkedGroup]);

  const generateLinkCode = async () => {
    setGenerating(true);
    try {
      const data = await fetchApi<{ status: string; code?: string; message?: string }>(
        "/telegram/generate-link-code",
        {
          method: "POST",
          body: JSON.stringify({ user_id: user?.id }),
        },
      );
      if (data.status === "success" && data.code) {
        setLinkCode(data.code);
        toast.success("Kode linking berhasil dibuat!");
      } else {
        throw new Error(data.message || "Gagal membuat kode.");
      }
    } catch (err: any) {
      console.error("Error generating link code:", err);
      toast.error(err.message || "Gagal membuat kode linking.");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (!linkCode) return;
    navigator.clipboard.writeText(linkCode);
    setCopied(true);
    toast.success("Kode disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestMessage = async () => {
    setTestSending(true);
    try {
      const data = await fetchApi<{ status: string; message?: string }>(
        "/telegram/test-broadcast",
        {
          method: "POST",
          body: JSON.stringify({ user_id: user?.id }),
        },
      );
      if (data.status === "success") {
        toast.success("Pesan tes berhasil terkirim ke group Telegram!");
      } else {
        throw new Error(data.message || "Gagal mengirim pesan tes.");
      }
    } catch (err: any) {
      console.error("Error sending test message:", err);
      toast.error(err.message || "Gagal mengirim pesan tes.");
    } finally {
      setTestSending(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const data = await fetchApi<{ status: string; message?: string }>(
        "/telegram/unlink",
        {
          method: "POST",
          body: JSON.stringify({ user_id: user?.id }),
        },
      );
      if (data.status === "success") {
        setLinkedGroup(null);
        setLinkCode(null);
        setAutoAlertEnabled(false);
        await refreshUser();
        toast.success("Group Telegram berhasil diputus.");
      } else {
        throw new Error(data.message || "Gagal memutus koneksi.");
      }
    } catch (err: any) {
      console.error("Error unlinking group:", err);
      toast.error(err.message || "Gagal memutus koneksi group.");
    } finally {
      setUnlinking(false);
    }
  };

  const handleToggleAutoAlert = async () => {
    setToggling(true);
    try {
      const newValue = !autoAlertEnabled;
      const response = await fetchApi<{ status: string }>(
        "/telegram/toggle-auto-alert",
        {
          method: "POST",
          body: JSON.stringify({ user_id: user?.id, enabled: newValue }),
        },
      );
      if (response.status === "success") {
        setAutoAlertEnabled(newValue);
        toast.success(newValue ? "Notifikasi otomatis diaktifkan!" : "Notifikasi otomatis dinonaktifkan.");
      } else {
        throw new Error("Gagal mengubah pengaturan.");
      }
    } catch (err: any) {
      console.error("Error toggling auto alert:", err);
      toast.error(err.message || "Gagal mengubah pengaturan.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="container mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MessageCircle className="h-6 w-6 text-primary" /> Konfigurasi Telegram
        </h1>
        <p className="text-sm text-muted-foreground">
          Hubungkan group Telegram komunitas Anda untuk menerima broadcast informasi peringatan banjir otomatis.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${linkedGroup ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Status Koneksi</CardTitle>
                <CardDescription>
                  {linkedGroup ? "Terhubung ke group Telegram" : "Belum terhubung"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkedGroup ? (
              <>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">{linkedGroup.groupTitle}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        ID: {linkedGroup.groupId} · Terhubung sejak{" "}
                        {new Date(linkedGroup.linkedAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <Radio className="h-3 w-3 animate-pulse" />
                    <span className="font-bold">AKTIF</span> — Broadcast otomatis dikirim ke group ini.
                  </div>
                </div>

                {/* Toggle Auto Alert */}
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Peringatan Otomatis</p>
                        <p className="text-[11px] text-muted-foreground">
                          Kirim notifikasi saat level pos berubah
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={autoAlertEnabled}
                      onCheckedChange={handleToggleAutoAlert}
                      disabled={toggling}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTestMessage}
                    disabled={testSending}
                    variant="outline"
                    className="flex-1"
                  >
                    {testSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Kirim Tes
                  </Button>
                  <Button
                    onClick={handleUnlink}
                    disabled={unlinking}
                    variant="outline"
                    className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    {unlinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                    Putuskan
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Belum ada group Telegram yang terhubung.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Buat kode linking, lalu kirimkan ke bot di group Telegram komunitas Anda.
                  </p>
                </div>

                <Button
                  onClick={generateLinkCode}
                  disabled={generating || !!linkCode}
                  className="w-full"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {linkCode ? "Kode Sudah Dibuat" : "Buat Kode Linking"}
                </Button>

                {linkCode && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Kode Linking
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-mono font-bold tracking-[0.15em] text-primary">
                        {linkCode}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={copyCode}
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Kirim ke grup komunitas sebelum membuat kode baru.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg text-accent">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">Cara Menghubungkan</CardTitle>
                <CardDescription>
                  Ikuti langkah berikut untuk menyambungkan group Telegram
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  1
                </span>
                <div>
                  <p className="font-medium">Tambahkan bot ke group Telegram</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Buka group Telegram komunitas Anda, lalu invite{" "}
                    <a
                      href={TELEGRAM_BOT_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline font-medium inline-flex items-center gap-1"
                    >
                      <MessageCircle className="h-3 w-3" /> {TELEGRAM_BOT_USERNAME}
                    </a>{" "}
                    ke dalam group.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  2
                </span>
                <div>
                  <p className="font-medium">Buat kode linking</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Klik tombol "Buat Kode Linking" di panel sebelah kiri untuk mendapatkan kode unik.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  3
                </span>
                <div>
                  <p className="font-medium">Kirim kode ke group</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Di group Telegram, kirim pesan{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                      /link {linkCode || "KODE-ANDA"}
                    </code>{" "}
                    dan sistem akan memverifikasi secara otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  4
                </span>
                <div>
                  <p className="font-medium">Selesai!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Setelah terverifikasi, group akan menerima broadcast peringatan otomatis saat ada perubahan status pos pantau.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground border border-border">
              <p className="mb-1.5 flex items-center gap-2 font-medium text-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Catatan Penting
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Bot harus memiliki izin mengirim pesan di group.</li>
                <li>Satu akun komunitas hanya bisa terhubung ke satu group.</li>
                <li>Kode linking hanya bisa digunakan sekali, buat kode baru jika gagal.</li>
                <li>Broadcast mencakup semua pos pantau yang di-subscribe komunitas Anda.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CommunityTelegramPage;
