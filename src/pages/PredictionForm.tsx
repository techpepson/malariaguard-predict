import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Thermometer, Droplets, Dna, Baby, User, MapPin } from "lucide-react";

const SYMPTOMS = [
  { key: "fever", label: "Fever" },
  { key: "chills", label: "Chills" },
  { key: "headache", label: "Headache" },
  { key: "sweating", label: "Excessive Sweating" },
  { key: "nausea", label: "Nausea" },
  { key: "vomiting", label: "Vomiting" },
  { key: "body_aches", label: "Body Aches / Muscle Pain" },
  { key: "fatigue", label: "Fatigue / Weakness" },
  { key: "diarrhea", label: "Diarrhea" },
] as const;

const REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Northern", "Upper East", "Upper West", "Volta", "Bono",
  "Savannah", "North East", "Oti", "Western North", "Ahafo", "Bono East",
  "Other / Outside Ghana",
];

export default function PredictionForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    patient_name: "",
    age: "",
    gender: "",
    pregnancy_status: "not_applicable",
    travel_history: "",
    region: "",
    fever: false,
    chills: false,
    headache: false,
    sweating: false,
    nausea: false,
    vomiting: false,
    body_aches: false,
    fatigue: false,
    diarrhea: false,
    temperature: "",
    hemoglobin: "",
    platelet_count: "",
    hbas_trait: false,
    g6pd_deficiency: false,
    duffy_antigen_negative: false,
  });

  const updateField = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name || !form.age || !form.gender) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        age: parseInt(form.age),
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        hemoglobin: form.hemoglobin ? parseFloat(form.hemoglobin) : null,
        platelet_count: form.platelet_count ? parseInt(form.platelet_count) : null,
      };

      const response = await supabase.functions.invoke("predict-malaria", { body: payload });

      if (response.error) throw new Error(response.error.message);

      toast({ title: "Prediction complete!", description: "View the results now." });
      navigate(`/results/${response.data.id}`);
    } catch (err: any) {
      toast({ title: "Prediction failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="font-display text-lg font-semibold">New Prediction</h1>
        </div>
      </header>

      <main className="container max-w-3xl py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Demographics */}
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <User className="h-4 w-4 text-primary" /> Patient Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Patient Name *</Label>
                <Input placeholder="Full name" value={form.patient_name} onChange={(e) => updateField("patient_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Age *</Label>
                <Input type="number" placeholder="Years" min={0} max={120} value={form.age} onChange={(e) => updateField("age", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Baby className="h-3 w-3" /> Pregnancy Status</Label>
                <Select value={form.pregnancy_status} onValueChange={(v) => updateField("pregnancy_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                    <SelectItem value="pregnant">Pregnant</SelectItem>
                    <SelectItem value="not_pregnant">Not Pregnant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Region</Label>
                <Select value={form.region} onValueChange={(v) => updateField("region", v)}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Travel History</Label>
                <Input placeholder="Recent travel to endemic areas" value={form.travel_history} onChange={(e) => updateField("travel_history", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Thermometer className="h-4 w-4 text-primary" /> Symptoms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {SYMPTOMS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent transition-colors">
                    <Checkbox checked={(form as any)[key]} onCheckedChange={(v) => updateField(key, !!v)} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lab Values */}
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Droplets className="h-4 w-4 text-primary" /> Lab Values
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Temperature (°C)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 38.5" value={form.temperature} onChange={(e) => updateField("temperature", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hemoglobin (g/dL)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 12.0" value={form.hemoglobin} onChange={(e) => updateField("hemoglobin", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Platelet Count (/µL)</Label>
                <Input type="number" placeholder="e.g. 150000" value={form.platelet_count} onChange={(e) => updateField("platelet_count", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Genetic Traits */}
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <Dna className="h-4 w-4 text-primary" /> Genetic Traits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { key: "hbas_trait", label: "HbAS (Sickle Cell Trait)" },
                  { key: "g6pd_deficiency", label: "G6PD Deficiency" },
                  { key: "duffy_antigen_negative", label: "Duffy Antigen Negative" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent transition-colors">
                    <Checkbox checked={(form as any)[key]} onCheckedChange={(v) => updateField(key, !!v)} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Patient Data...</>
            ) : (
              "Run Malaria Risk Prediction"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
