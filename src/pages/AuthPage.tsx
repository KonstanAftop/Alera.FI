import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mountain, User, Building2, ChevronRight, ChevronLeft, Check, LogIn, X, ArrowLeft, Droplets, Radio, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import RegisterMap from "@/components/RegisterMap";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";
import bgImage from "@/assets/landing-bg.jpg";

const AuthPage = () => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"personal" | "community">("personal");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    nama: "",
    password: "",
    instansi: "",
    homeAddress: "",
    telegram: "",
  });
  const [lngLat, setLngLat] = useState<[number, number] | null>(null);
  const [elevation, setElevation] = useState<number>(0);
  const [selectedPosIds, setSelectedPosIds] = useState<string[]>([]);
  const [recommendedPosIds, setRecommendedPosIds] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [riskProfile, setRiskProfile] = useState<string>("");
  const [riverDistance, setRiverDistance] = useState<number>(0);

  // Fetch real instruments via Backend Proxy
  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/instruments`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map(d => ({
            id: d.sensor_id,
            nama: d.pos_name,
            tipe: (d.sensor_type?.toLowerCase().startsWith('rain') || d.sensor_type === 'rf') ? 'ARR' : 'AWLR',
            lngLat: [d.lon, d.lat],
            elevation: d.elevation
          }));
          setInstruments(formatted);
        }
      } catch (err) {
        console.error("Proxy Fetch Error:", err);
      }
    };
    fetchInstruments();
  }, []);

  const handleNext = async () => {
    // If moving from Step 2 to Step 3 (Personal), trigger backend recommendation
    if (step === 2 && role === "personal" && lngLat) {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/register/profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            lat: lngLat[1],
            lon: lngLat[0],
            role: "personal"
          })
        });
        const data = await res.json();
        if (data.status === "success" && data.recommended_pos) {
          setRecommendedPosIds(data.recommended_pos);
          setSelectedPosIds(data.recommended_pos); // Auto-select recommended
          if (data.user_elevation != null) setElevation(data.user_elevation);
          if (data.risk_profile) setRiskProfile(data.risk_profile);
          if (data.river_distance != null) setRiverDistance(data.river_distance);
          toast.success("Area dianalisis! Pos terdekat & upstream direkomendasikan.");
        }
      } catch (err) {
        console.warn("Backend recommendations failed, using default view.", err);
      } finally {
        setIsLoading(false);
      }
    }
    setStep(step + 1);
  };

  const handlePrev = () => setStep(step - 1);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast.success("Berhasil masuk!");
        navigate("/");
      } else {
        // 1. Create user via backend admin API (bypasses email confirmation)
        const authRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            full_name: formData.nama,
            role,
          }),
        });

        if (!authRes.ok) {
          const text = await authRes.text();
          throw new Error(`Auth server error ${authRes.status}: ${text.slice(0, 200)}`);
        }

        const authResult = await authRes.json();
        if (authResult.status !== "success") {
          throw new Error(authResult.message || "Gagal membuat akun di server.");
        }

        const userId = authResult.user_id;
        if (!userId) throw new Error("Server tidak mengembalikan user ID.");

        // 2. Send all registration data to backend (service_role inserts)
        const backendPayload: any = {
          user_id: userId,
          email: formData.email,
          role: role,
          full_name: formData.nama,
          selected_pos_ids: selectedPosIds,
          instruments: instruments,
        };

        if (role === "personal") {
          backendPayload.lat = lngLat?.[1];
          backendPayload.lon = lngLat?.[0];
          backendPayload.address = formData.homeAddress;
          backendPayload.elevation = elevation;
          backendPayload.risk_profile = riskProfile;
          backendPayload.river_distance = riverDistance;
        }

        const res = await fetch(`${API_BASE_URL}/register/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendPayload),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`);
        }

        const result = await res.json();
        if (result.status !== "success") {
          throw new Error(result.message || "Gagal menyimpan data registrasi di server.");
        }

        // 3. Auto-login and redirect to dashboard
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (signInError) throw signInError;

        toast.success("Pendaftaran berhasil! Selamat datang.");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat autentikasi.");
    } finally {
      setIsLoading(false);
    }
  };


  const togglePos = (id: string) => {
    setSelectedPosIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-2xl border-border bg-card/80 backdrop-blur-3xl text-card-foreground shadow-2xl relative z-10 overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-black flex items-center justify-center shadow-[var(--shadow-glow)]">
            <img
              src="/alera-logo.png"
              alt="Alera FI Logo"
              className="h-11 w-11 rounded-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Alera FI</CardTitle>
          <CardDescription className="text-muted-foreground">Flood Monitoring & Early Warning — Community-Driven</CardDescription>
        </CardHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted border border-border p-1 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Masuk</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Daftar</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="login" className="px-6 pb-8 animate-in fade-in slide-in-from-bottom-4">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email</Label>
                <Input 
                  id="email-login" 
                  type="email" 
                  placeholder="name@example.com" 
                  className="bg-muted/50 border-border focus:border-primary h-11"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Kata Sandi</Label>
                <Input 
                  id="password-login" 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-muted/50 border-border focus:border-primary h-11" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 h-11 font-bold mt-2 shadow-lg shadow-primary/20 transition-all">
                {isLoading ? "Memproses..." : "Masuk ke Dashboard"} <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="pb-4">
            <div className="px-6 space-y-6">
              {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">1. Tipe Akun</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setRole("personal")}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${role === "personal" ? "border-primary bg-primary/10" : "border-border bg-muted/50 hover:border-muted-foreground/30"}`}
                          >
                            <User className={`h-6 w-6 ${role === "personal" ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="font-semibold">Individu</span>
                            <span className="text-[10px] text-muted-foreground text-center">Warga yang ingin memantau area rumah</span>
                          </button>
                          <button 
                            onClick={() => setRole("community")}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${role === "community" ? "border-primary bg-primary/10" : "border-border bg-muted/50 hover:border-muted-foreground/30"}`}
                          >
                            <Building2 className={`h-6 w-6 ${role === "community" ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="font-semibold">Komunitas</span>
                            <span className="text-[10px] text-muted-foreground text-center">Organisasi atau Instansi pengelola wilayah</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">{role === "personal" ? "Nama Lengkap" : "Nama Instansi"}</Label>
                          <Input 
                            id="name" 
                            placeholder={role === "personal" ? "John Doe" : "BPBD Kab. Bandung"} 
                            className="bg-muted/50 border-border h-11"
                            value={formData.nama}
                            onChange={(e) => setFormData({...formData, nama: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email-reg">Email</Label>
                          <Input 
                            id="email-reg" 
                            type="email" 
                            placeholder="name@example.com" 
                            className="bg-muted/50 border-border h-11" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="pass-reg">Kata Sandi</Label>
                          <Input 
                            id="pass-reg" 
                            type="password" 
                            placeholder="••••••••" 
                            className="bg-muted/50 border-border h-11"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <Button onClick={handleNext} className="w-full bg-primary hover:bg-primary/90 h-11 font-bold">
                        Lanjut {role === "personal" ? "Tentukan Lokasi" : "Pilih Pos Pantau"} <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {step === 2 && role === "personal" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">2. Lokasi Rumah</Label>
                        <div className="h-[300px] w-full">
                          <RegisterMap 
                            onLocationChange={(ll, addr) => {
                              setLngLat(ll);
                              if (addr) setFormData({...formData, homeAddress: addr});
                            }}
                            instruments={instruments}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">Geser pin biru tepat di lokasi rumah Anda untuk akurasi rekomendasi.</p>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="ghost" onClick={handlePrev} className="flex-1 border border-border hover:bg-muted"><ChevronLeft className="mr-2 h-4 w-4" /> Kembali</Button>
                        <Button onClick={handleNext} disabled={!lngLat || isLoading} className="flex-[2] bg-primary hover:bg-primary/90 font-bold">
                          {isLoading ? "Menganalisis..." : "Lanjut Pilih Pos"} <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {(step === 3 || (step === 2 && role === "community")) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {role === "personal" ? "3. Pilih Pos Pantau" : "2. Pilih Pos Pantau"}
                        </Label>
                        <div className="h-[350px] w-full rounded-xl overflow-hidden border border-border shadow-inner bg-background">
                          <RegisterMap 
                            initialCenter={lngLat || undefined}
                            locationLngLat={lngLat || undefined}
                            selectedPosIds={selectedPosIds}
                            onPosToggle={togglePos}
                            recommendedPosIds={recommendedPosIds}
                            instruments={instruments}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pos Terpilih ({selectedPosIds.length})</span>
                            {selectedPosIds.length > 0 && <button onClick={() => setSelectedPosIds([])} className="text-[10px] text-destructive hover:underline">Hapus Semua</button>}
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
                            {selectedPosIds.map(id => {
                              const p = instruments.find(item => item.id === id);
                              return (
                                <div key={id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-[11px] font-medium text-primary">
                                  <span>{p?.nama}</span>
                                  <button onClick={() => togglePos(id)} className="hover:text-foreground"><X className="h-3 w-3" /></button>
                                </div>
                              );
                            })}
                            {selectedPosIds.length === 0 && <p className="text-[11px] text-muted-foreground italic py-2">Klik marker pada peta untuk memilih pos pantau.</p>}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={handlePrev} className="flex-1 border border-border hover:bg-muted"><ChevronLeft className="mr-2 h-4 w-4" /> Kembali</Button>
                        <Button onClick={handleAuth} disabled={selectedPosIds.length === 0 || isLoading} className="flex-[2] bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                          {isLoading ? "Menyimpan..." : "Selesaikan Pendaftaran"} <Check className="mr-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
            </div>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="justify-center border-t border-border py-4 bg-muted/50">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-tighter">© 2026 Alera FI · Secure Auth Protected</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
