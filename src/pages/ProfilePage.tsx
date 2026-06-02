import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, MapPin, Save, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import RegisterMap from "@/components/RegisterMap";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL, fetchApi } from "@/lib/api";

const ProfilePage = () => {
  const { user, signOut, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: user?.nama || "",
    email: user?.email || "",
    address: user?.homeAddress || "",
  });
  const [selectedPosIds, setSelectedPosIds] = useState<string[]>(user?.subscribedPosIds || []);
  const [recommendedPosIds, setRecommendedPosIds] = useState<string[]>([]);
  const [locationLngLat, setLocationLngLat] = useState<[number, number] | null>(user?.homeLngLat || null);
  const [instruments, setInstruments] = useState<Array<{
    id: string;
    nama: string;
    tipe: 'ARR' | 'AWLR';
    lngLat: [number, number];
    elevation: number;
    kategori: string;
  }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    setFormData({
      nama: user.nama || "",
      email: user.email || "",
      address: user.homeAddress || "",
    });
    setSelectedPosIds(user.subscribedPosIds || []);
    setLocationLngLat(user.homeLngLat || null);
  }, [user]);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/instruments`);
        const data = await res.json() as Array<{
          sensor_id: string;
          pos_name: string;
          sensor_type: string;
          lon: number;
          lat: number;
          elevation: number;
        }>;
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((d) => ({
            id: d.sensor_id,
            nama: d.pos_name,
            tipe: ((d.sensor_type?.toLowerCase().startsWith('rain') || d.sensor_type === 'rf') ? 'ARR' : 'AWLR') as 'ARR' | 'AWLR',
            lngLat: [d.lon, d.lat] as [number, number],
            elevation: d.elevation,
            kategori: d.elevation > 900 ? 'hulu' : d.elevation > 660 ? 'tengah' : 'hilir',
          }));
          setInstruments(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch instruments:", err);
      }
    };
    fetchInstruments();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: {
        user_id: string;
        role: 'personal' | 'community';
        full_name: string;
        email: string;
        selected_pos_ids: string[];
        instruments: Array<{
          id: string;
          nama: string;
          tipe: 'ARR' | 'AWLR';
          lngLat: [number, number];
          elevation: number;
          kategori: string;
        }>;
        lat?: number;
        lon?: number;
        address?: string;
      } = {
        user_id: user.id,
        role: user.role,
        full_name: formData.nama,
        email: formData.email,
        selected_pos_ids: selectedPosIds,
        instruments,
      };

      if (user.role === "personal") {
        if (!locationLngLat) {
          throw new Error("Tentukan lokasi individu terlebih dahulu.");
        }
        payload.lat = locationLngLat[1];
        payload.lon = locationLngLat[0];
        payload.address = formData.address;
      }

      await fetchApi("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await refreshUser();
      toast.success("Profil berhasil diperbarui.");
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.info("Anda telah keluar.");
    navigate("/auth");
  };

  const togglePos = (id: string) => {
    setSelectedPosIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const refreshRecommendedStations = async (lngLat: [number, number]) => {
    if (user.role !== "personal") return;
    setIsAnalyzing(true);
    try {
      const response = await fetchApi<{
        status: string;
        recommended_pos?: string[];
      }>("/register/profile", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          lat: lngLat[1],
          lon: lngLat[0],
          role: "personal",
        }),
      });
      if (response.status === "success" && response.recommended_pos) {
        setRecommendedPosIds(response.recommended_pos);
        setSelectedPosIds(response.recommended_pos);
      }
    } catch (err) {
      console.error("Failed to refresh stations:", err);
      toast.error("Gagal memperbarui rekomendasi pos.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Info */}
        <div className="flex-1 space-y-6">
          <Card className="border-border bg-card backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Informasi Profil</CardTitle>
                  <CardDescription>Kelola detail akun dan preferensi Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama {user.role === "community" ? "Instansi" : "Lengkap"}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="nama" 
                    value={formData.nama}
                    onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    className="bg-muted/50 border-border pl-10"
                  />
                </div>
              </div>
              {user.role === "personal" && (
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Lokasi</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-muted/50 border-border pl-10"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    value={formData.email}
                    readOnly
                    className="bg-muted/50 border-border pl-10"
                  />
                </div>
              </div>
              <div className="pt-4 flex flex-col gap-3">
                <Button onClick={handleSave} disabled={isSaving} className="w-full bg-primary hover:bg-primary/90 font-bold">
                  <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                </Button>
                <Button onClick={handleLogout} variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" /> Keluar dari Akun
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Subscriptions */}
        <div className="flex-[2] space-y-6">
          <Card className="border-border bg-card backdrop-blur-xl h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{user.role === "personal" ? "Pos Pantau Langganan" : "Pos Pantau Dikelola"}</CardTitle>
                    <CardDescription>
                      {user.role === "personal"
                        ? "Geser marker lokasi untuk memperbarui rekomendasi pos secara otomatis, lalu sesuaikan bila perlu."
                        : "Pilih pos yang ingin Anda pantau di dashboard."}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-2xl font-bold text-muted-foreground/30">#{selectedPosIds.length}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[450px] w-full rounded-xl overflow-hidden border border-border shadow-inner bg-background">
                <RegisterMap 
                  initialCenter={user.homeLngLat}
                  locationLngLat={locationLngLat || undefined}
                  onLocationChange={user.role === "personal" ? (ll, addr) => {
                    setLocationLngLat(ll);
                    if (addr) {
                      setFormData((prev) => ({ ...prev, address: addr }));
                    }
                    void refreshRecommendedStations(ll);
                  } : undefined}
                  selectedPosIds={selectedPosIds}
                  onPosToggle={togglePos}
                  recommendedPosIds={recommendedPosIds}
                  selectable={true}
                  instruments={instruments}
                />
              </div>
              {user.role === "personal" && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-700">
                  {isAnalyzing
                    ? "Memperbarui rekomendasi pos dari titik lokasi baru..."
                    : "Lokasi individu divisualisasikan di peta. Saat titik dipindah, daftar pos akan diperbarui otomatis."}
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Daftar Langganan ({selectedPosIds.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedPosIds.map(id => {
                    const pos = instruments.find((p) => p.id === id);
                    return (
                      <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border text-xs transition-all hover:border-primary/30 group">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">{pos?.nama || id}</span>
                          <span className="text-[10px] text-muted-foreground">{pos?.tipe || '?'} · {pos?.kategori || '?'}</span>
                        </div>
                        <button onClick={() => togglePos(id)} className="text-muted-foreground/30 hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                  {selectedPosIds.length === 0 && (
                    <div className="col-span-full py-8 text-center border border-dashed border-border rounded-xl">
                      <p className="text-xs text-muted-foreground">Belum ada pos yang dipilih. Klik pada peta untuk berlangganan.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
