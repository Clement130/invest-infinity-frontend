-- Create timestamp function for triggers
CREATE OR REPLACE FUNCTION public.set_current_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.set_current_timestamp() TO authenticated;
