import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Activity, Plus, LogOut, Clock, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Prediction = Tables<"predictions">;

const RISK_BADGE: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-success/15 text-success border-success/30" },
  moderate: { label: "Moderate", className: "bg-warning/15 text-warning border-warning/30" },
  high: { label: "High", className: "bg-risk-high/15 text-risk-high border-risk-high/30" },
  very_high: { label: "Very High", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPredictions() {
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: false });
    setPredictions(data || []);
    setLoading(false);
  }

  useEffect(() => { loadPredictions(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("predictions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete prediction");
      return;
    }
    setPredictions((prev) => prev.filter((p) => p.id !== id));
    toast.success("Prediction deleted");
  };

  const stats = {
    total: predictions.length,
    high_risk: predictions.filter((p) => p.risk_level === "high" || p.risk_level === "very_high").length,
    low_risk: predictions.filter((p) => p.risk_level === "low").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">MalariaPredict</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/auth"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Predictions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.high_risk}</p>
                <p className="text-xs text-muted-foreground">High Risk Cases</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-display">{stats.low_risk}</p>
                <p className="text-xs text-muted-foreground">Low Risk Cases</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action */}
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent Predictions</h2>
          <Button onClick={() => navigate("/predict")}>
            <Plus className="mr-2 h-4 w-4" /> New Prediction
          </Button>
        </div>

        {/* Predictions List */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading...</div>
        ) : predictions.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <Activity className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No predictions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Run your first malaria risk assessment</p>
              <Button className="mt-4" onClick={() => navigate("/predict")}>
                <Plus className="mr-2 h-4 w-4" /> Create Prediction
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {predictions.map((p) => {
              const risk = p.risk_level ? RISK_BADGE[p.risk_level] : null;
              return (
                <Card
                  key={p.id}
                  className="shadow-card cursor-pointer transition-all hover:shadow-medical"
                  onClick={() => navigate(`/results/${p.id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{p.patient_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(p.created_at).toLocaleDateString()} · Age {p.age} · {p.gender}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.risk_score != null && (
                        <span className="text-sm font-semibold font-display">{p.risk_score.toFixed(0)}%</span>
                      )}
                      {risk && (
                        <Badge variant="outline" className={risk.className}>
                          {risk.label}
                        </Badge>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete prediction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the prediction for <strong>{p.patient_name}</strong>. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={(e) => handleDelete(p.id, e)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
