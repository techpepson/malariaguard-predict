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
    console.log("Patient data received:", JSON.stringify(patientData));
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are an evidence-based malaria clinical decision-support system. Analyze the following patient data using this structured reasoning framework:

## 1. Exposure Assessment
Evaluate the patient's geographic and travel-related malaria exposure risk.
- Region: ${patientData.region || "Not specified"}
- Travel History: ${patientData.travel_history || "None reported"}

## 2. Symptom Pattern Analysis
Identify classic malaria symptom clusters (e.g., paroxysmal fever with chills and sweating, gastrointestinal involvement).
- Fever: ${patientData.fever ? "Yes" : "No"}
- Chills: ${patientData.chills ? "Yes" : "No"}
- Sweating: ${patientData.sweating ? "Yes" : "No"}
- Headache: ${patientData.headache ? "Yes" : "No"}
- Nausea: ${patientData.nausea ? "Yes" : "No"}
- Vomiting: ${patientData.vomiting ? "Yes" : "No"}
- Body Aches: ${patientData.body_aches ? "Yes" : "No"}
- Fatigue: ${patientData.fatigue ? "Yes" : "No"}
- Diarrhea: ${patientData.diarrhea ? "Yes" : "No"}

## 3. Laboratory Correlation
Interpret lab values in context of malaria indicators:
- Temperature: ${patientData.temperature || "Not taken"}°C (fever ≥38°C is significant; ≥39.5°C strongly suggestive)
- Hemoglobin: ${patientData.hemoglobin || "Not tested"} g/dL (low Hb suggests hemolytic anemia, common in malaria)
- Platelet Count: ${patientData.platelet_count || "Not tested"} /µL (thrombocytopenia <150,000 is a strong malaria indicator)

## 4. Genetic Risk Adjustment
Adjust risk assessment based on known protective or susceptibility factors:
- HbAS (Sickle Cell Trait): ${patientData.hbas_trait ? "Positive (confers ~50% protection against severe P. falciparum)" : "Negative/Unknown"}
- G6PD Deficiency: ${patientData.g6pd_deficiency ? "Yes (important for treatment choice - avoid primaquine)" : "No/Unknown"}
- Duffy Antigen Negative: ${patientData.duffy_antigen_negative ? "Yes (protective against P. vivax)" : "No/Unknown"}

## 5. Patient Demographics
- Name: ${patientData.patient_name}
- Age: ${patientData.age} (children <5 and elderly at higher risk for severe disease)
- Gender: ${patientData.gender}
- Pregnancy Status: ${patientData.pregnancy_status || "N/A"} (pregnancy increases malaria severity risk)

## Instructions
1. Synthesize all factors to determine a malaria status: "positive" (likely infected, needs treatment) or "negative" (unlikely infected).
2. Produce a confidence score (0-100) representing how confident you are in the assessment.
3. Weight factors appropriately: endemic region exposure + classic symptom triad (fever/chills/sweating) + thrombocytopenia are the strongest predictors.
4. A patient with ≥3 classic symptoms + endemic exposure + lab abnormalities should be classified as positive.
5. A patient with few/no symptoms, no exposure, and normal labs should be classified as negative.
6. Apply genetic modifiers: HbAS trait should reduce likelihood; Duffy negativity should reduce P. vivax risk.
7. Consider differential diagnoses (dengue, typhoid, viral infections) in your recommendation.
8. Do NOT provide a definitive diagnosis. Frame as clinical assessment requiring confirmatory testing (RDT/microscopy).
9. Be evidence-based and structured. Do not exaggerate certainty.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an evidence-based malaria clinical decision-support system. Follow structured clinical reasoning: exposure assessment, symptom pattern analysis, laboratory correlation, genetic risk adjustment, risk synthesis, differential consideration, and clinical recommendation. Never provide definitive diagnoses. Be cautious, evidence-based, and structured." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "malaria_risk_assessment",
            description: "Provide structured malaria risk assessment with positive/negative status",
            parameters: {
              type: "object",
              properties: {
                malaria_status: { type: "string", enum: ["positive", "negative"], description: "Whether patient is likely positive or negative for malaria" },
                risk_level: { type: "string", enum: ["low", "moderate", "high", "very_high"], description: "Overall risk level for severity" },
                risk_score: { type: "number", description: "Confidence score from 0-100" },
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
              required: ["malaria_status", "risk_level", "risk_score", "contributing_factors", "recommendation"],
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
    console.log("AI prediction result:", JSON.stringify(prediction));

    // Derive risk_level from malaria_status if needed for DB compatibility
    const effectiveRiskLevel = prediction.risk_level || (prediction.malaria_status === "positive" ? "high" : "low");

    // Save to database
    const { data: savedPrediction, error: saveError } = await supabaseClient
      .from("predictions")
      .insert({
        ...patientData,
        user_id: user.id,
        risk_level: effectiveRiskLevel,
        risk_score: prediction.risk_score,
        contributing_factors: prediction.contributing_factors,
        recommendation: prediction.malaria_status === "positive"
          ? `MALARIA STATUS: POSITIVE\n\n${prediction.recommendation}`
          : `MALARIA STATUS: NEGATIVE\n\n${prediction.recommendation}`,
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
