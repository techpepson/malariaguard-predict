import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Activity } from "lucide-react";

export default function VerifySuccess() {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Supabase auto-exchanges the token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setVerified(true);
      }
    });
    // Also check immediately in case already resolved
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setVerified(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Email Verified!</h1>
        <p className="mt-2 text-muted-foreground">
          Your account has been successfully verified. You can now access the malaria prediction system.
        </p>
        <Button className="mt-6" size="lg" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </Button>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" /> MalariaPredict
        </div>
      </div>
    </div>
  );
}
