import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Activity, Shield, Zap, BarChart3, ArrowRight } from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">MalariaPredict</span>
          </div>
          <Button size="sm" onClick={handleGetStarted}>
            {user ? "Dashboard" : "Get Started"}
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-gradient-hero">
          <div className="container py-24 text-center md:py-32">
            <div className="mx-auto max-w-2xl animate-fade-in">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5" /> AI-Powered Clinical Assessment
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Early Malaria
                <span className="text-gradient-primary"> Risk Detection</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                A machine learning–based system that predicts malaria likelihood using clinical symptoms,
                lab values, and genetic traits. Fast, cost-effective screening for healthcare providers in Ghana.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" onClick={handleGetStarted} className="gap-2">
                  Start Assessment <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="container py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "AI-Powered Analysis",
                desc: "Advanced ML algorithms analyze patient symptoms, demographics, lab values, and genetic traits for accurate risk prediction.",
              },
              {
                icon: Shield,
                title: "Clinical-Grade Security",
                desc: "HIPAA-ready architecture with encrypted data storage and role-based access control for patient data protection.",
              },
              {
                icon: BarChart3,
                title: "Actionable Insights",
                desc: "Clear risk scores, contributing factors breakdown, and clinical recommendations for each patient assessment.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-medical">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-card/50">
          <div className="container py-12 text-center">
            <p className="text-xs text-muted-foreground">
              Built for healthcare providers in Ghana · ML-powered risk assessment · Not a substitute for laboratory diagnosis
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
