CREATE TABLE IF NOT EXISTS public.appointment_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_profiles TO authenticated;
GRANT ALL ON public.appointment_profiles TO service_role;

ALTER TABLE public.appointment_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage appointment profiles"
  ON public.appointment_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS appointment_profiles_updated_at ON public.appointment_profiles;
CREATE TRIGGER appointment_profiles_updated_at
  BEFORE UPDATE ON public.appointment_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();