
-- Create enum for risk levels
CREATE TYPE public.risk_level AS ENUM ('low', 'moderate', 'high', 'very_high');

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Demographics
  patient_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  pregnancy_status TEXT DEFAULT 'not_applicable',
  travel_history TEXT,
  region TEXT,
  
  -- Symptoms (boolean flags)
  fever BOOLEAN DEFAULT FALSE,
  chills BOOLEAN DEFAULT FALSE,
  headache BOOLEAN DEFAULT FALSE,
  sweating BOOLEAN DEFAULT FALSE,
  nausea BOOLEAN DEFAULT FALSE,
  vomiting BOOLEAN DEFAULT FALSE,
  body_aches BOOLEAN DEFAULT FALSE,
  fatigue BOOLEAN DEFAULT FALSE,
  diarrhea BOOLEAN DEFAULT FALSE,
  
  -- Lab values
  temperature NUMERIC(4,1),
  hemoglobin NUMERIC(4,1),
  platelet_count INTEGER,
  
  -- Genetic traits
  hbas_trait BOOLEAN DEFAULT FALSE,
  g6pd_deficiency BOOLEAN DEFAULT FALSE,
  duffy_antigen_negative BOOLEAN DEFAULT FALSE,
  
  -- Results
  risk_level risk_level,
  risk_score NUMERIC(5,2),
  contributing_factors JSONB,
  recommendation TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own predictions"
ON public.predictions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create predictions"
ON public.predictions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions"
ON public.predictions FOR DELETE
USING (auth.uid() = user_id);
