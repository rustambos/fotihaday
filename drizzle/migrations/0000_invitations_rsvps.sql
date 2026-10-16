CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invitations TO anon, authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read invitations" ON public.invitations FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
  guest_name text NOT NULL CHECK (char_length(guest_name) BETWEEN 1 AND 100),
  guests_count int NOT NULL DEFAULT 1 CHECK (guests_count BETWEEN 1 AND 20),
  attending boolean NOT NULL,
  message text CHECK (message IS NULL OR char_length(message) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.rsvps TO anon, authenticated;
GRANT ALL ON public.rsvps TO service_role;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit RSVP" ON public.rsvps FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX rsvps_invitation_idx ON public.rsvps(invitation_id);