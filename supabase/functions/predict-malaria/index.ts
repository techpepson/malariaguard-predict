import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patientData = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an expert malaria risk assessment AI. Analyze the following patient data and provide a malaria risk prediction.

Patient Data:
- Name: ${patientData.patient_name}
- Age: ${patientData.age}
- Gender: ${patientData.gender}
- Pregnancy Status: ${patientData.pregnancy_status || "N/A"}
- Travel History: ${patientData.travel_history || "None"}
- Region: ${patientData.region || "Not specified"}

Symptoms:
- Fever: ${patientData.fever ? "Yes" : "No"}
- Chills: ${patientData.chills ? "Yes" : "No"}
- Headache: ${patientData.headache ? "Yes" : "No"}
- Sweating: ${patientData.sweating ? "Yes" : "No"}
- Nausea: ${patientData.nausea ? "Yes" : "No"}
- Vomiting: ${patientData.vomiting ? "Yes" : "No"}
- Body Aches: ${patientData.body_aches ? "Yes" : "No"}
- Fatigue: ${patientData.fatigue ? "Yes" : "No"}
- Diarrhea: ${patientData.diarrhea ? "Yes" : "No"}

Lab Values:
- Temperature: ${patientData.temperature || "Not taken"}°C
- Hemoglobin (Hb): ${patientData.hemoglobin || "Not tested"} g/dL
- Platelet Count: ${patientData.platelet_count || "Not tested"} /µL

Genetic Traits:
- HbAS (Sickle Cell Trait): ${patientData.hbas_trait ? "Positive" : "Negative/Unknown"}
- G6PD Deficiency: ${patientData.g6pd_deficiency ? "Yes" : "No/Unknown"}
- Duffy Antigen Negative: ${patientData.duffy_antigen_negative ? "Yes" : "No/Unknown"}

Based on clinical evidence and epidemiological data, assess this patient's malaria risk.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a clinical malaria risk assessment system." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "malaria_risk_assessment",
            description: "Provide structured malaria risk assessment",
            parameters: {
              type: "object",
              properties: {
                risk_level: { type: "string", enum: ["low", "moderate", "high", "very_high"], description: "Overall risk level" },
                risk_score: { type: "number", description: "Risk score from 0-100" },
                contributing_factors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      factor: { type: "string" },
                      impact: { type: "string", enum: ["positive", "negative", "neutral"] },
                      description: { type: "string" },
                    },
                    required: ["factor", "impact", "description"],
                  },
                },
                recommendation: { type: "string", description: "Clinical recommendation for the patient" },
              },
              required: ["risk_level", "risk_score", "contributing_factors", "recommendation"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "malaria_risk_assessment" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error("AI prediction failed");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No prediction result from AI");
    }

    const prediction = JSON.parse(toolCall.function.arguments);

    // Save to database
    const { data: savedPrediction, error: saveError } = await supabaseClient
      .from("predictions")
      .insert({
        ...patientData,
        user_id: user.id,
        risk_level: prediction.risk_level,
        risk_score: prediction.risk_score,
        contributing_factors: prediction.contributing_factors,
        recommendation: prediction.recommendation,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save prediction");
    }

    return new Response(JSON.stringify(savedPrediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Prediction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
