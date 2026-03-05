import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, Minus, FileText, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Prediction = Tables<"predictions">;

function getMalariaStatus(prediction: Prediction): "positive" | "negative" {
  // Derive from recommendation prefix or risk_level
  if (prediction.recommendation?.startsWith("MALARIA STATUS: POSITIVE")) return "positive";
  if (prediction.recommendation?.startsWith("MALARIA STATUS: NEGATIVE")) return "negative";
  // Fallback: high/very_high = positive, else negative
  return prediction.risk_level === "high" || prediction.risk_level === "very_high" ? "positive" : "negative";
}

function getCleanRecommendation(recommendation: string | null): string {
  if (!recommendation) return "";
  return recommendation.replace(/^MALARIA STATUS: (POSITIVE|NEGATIVE)\n\n/, "");
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const { data } = await supabase.from("predictions").select("*").eq("id", id).single();
      setPrediction(data);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Prediction not found.</p>
      </div>
    );
  }

  const status = getMalariaStatus(prediction);
  const isPositive = status === "positive";
  const factors = (prediction.contributing_factors as any[]) || [];
  const cleanRec = getCleanRecommendation(prediction.recommendation);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <h1 className="font-display text-lg font-semibold">Prediction Results</h1>
        </div>
      </header>

      <main className="container max-w-3xl py-8 space-y-6">
        {/* Status Card */}
        <Card className="shadow-medical overflow-hidden">
          <div className={`px-6 py-10 text-center ${isPositive ? "bg-destructive" : "bg-success"} text-primary-foreground`}>
            {isPositive ? (
              <ShieldAlert className="mx-auto mb-3 h-12 w-12" />
            ) : (
              <ShieldCheck className="mx-auto mb-3 h-12 w-12" />
            )}
            <h2 className="font-display text-3xl font-bold">
              {isPositive ? "POSITIVE" : "NEGATIVE"}
            </h2>
            <p className="mt-1 text-sm opacity-90">
              {isPositive ? "Malaria infection likely detected" : "No malaria infection detected"}
            </p>
            <p className="mt-3 text-lg font-semibold opacity-90">
              {prediction.risk_score?.toFixed(0)}% confidence
            </p>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Patient</span>
                <p className="font-medium">{prediction.patient_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Age / Gender</span>
                <p className="font-medium">{prediction.age} / {prediction.gender}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Region</span>
                <p className="font-medium">{prediction.region || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date</span>
                <p className="font-medium">{new Date(prediction.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contributing Factors */}
        {factors.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-base">Contributing Factors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {factors.map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  {f.impact === "negative" ? (
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  ) : f.impact === "positive" ? (
                    <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{f.factor}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recommendation */}
        {cleanRec && (
          <Card className="shadow-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-base">
                <FileText className="h-4 w-4 text-primary" /> Clinical Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground">{cleanRec}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/predict")}>New Prediction</Button>
          <Button className="flex-1" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </main>
    </div>
  );
}
