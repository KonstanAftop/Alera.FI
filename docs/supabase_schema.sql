-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_settings (
  key text NOT NULL,
  value text NOT NULL,
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.community_profiles (
  user_id uuid NOT NULL,
  community_name text NOT NULL,
  telegram_group_id text,
  bot_token text,
  managed_area text,
  CONSTRAINT community_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT community_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.community_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  sensor_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT community_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT community_subscriptions_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.profiles(id),
  CONSTRAINT community_subscriptions_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.instrument_metadata(sensor_id)
);
CREATE TABLE public.flood_reports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  community_id uuid,
  location_text text,
  severity text CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  description text,
  image_url text,
  reported_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT flood_reports_pkey PRIMARY KEY (id),
  CONSTRAINT flood_reports_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.individual_profiles (
  user_id uuid NOT NULL,
  location_lat double precision,
  location_lng double precision,
  address text,
  elevation double precision,
  risk_profile text,
  distance_to_river double precision,
  CONSTRAINT individual_profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT individual_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.instrument_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sensor_id text NOT NULL UNIQUE,
  pos_name text NOT NULL,
  sensor_type text NOT NULL CHECK (sensor_type = ANY (ARRAY['rf'::text, 'wl'::text])),
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  elevation double precision,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT instrument_metadata_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  sensor_id text,
  warning_level integer NOT NULL,
  message_text text,
  sent_at timestamp with time zone DEFAULT now(),
  channel text NOT NULL CHECK (channel = ANY (ARRAY['telegram_dm'::text, 'telegram_channel'::text])),
  CONSTRAINT notification_log_pkey PRIMARY KEY (id),
  CONSTRAINT notification_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notification_log_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.instrument_metadata(sensor_id)
);
CREATE TABLE public.obs_data (
  id bigint NOT NULL DEFAULT nextval('obs_data_id_seq'::regclass),
  sensor_id text NOT NULL,
  value numeric NOT NULL,
  warning_level integer NOT NULL DEFAULT 0 CHECK (warning_level >= 0 AND warning_level <= 3),
  measured_at timestamp with time zone NOT NULL,
  retrieve_at timestamp with time zone DEFAULT now(),
  CONSTRAINT obs_data_pkey PRIMARY KEY (id),
  CONSTRAINT obs_data_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.instrument_metadata(sensor_id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['personal'::text, 'community'::text])),
  activation_code text UNIQUE,
  telegram_linked boolean DEFAULT false,
  chat_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.sensor_current_state (
  sensor_id text NOT NULL,
  current_warning_level integer DEFAULT 0,
  previous_warning_level integer DEFAULT 0,
  current_value numeric,
  previous_value numeric,
  trend_3h text CHECK (trend_3h = ANY (ARRAY['naik'::text, 'turun'::text, 'stabil'::text])),
  last_changed_at timestamp with time zone,
  last_updated_at timestamp with time zone DEFAULT now(),
  last_alert_sent_at timestamp with time zone,
  CONSTRAINT sensor_current_state_pkey PRIMARY KEY (sensor_id),
  CONSTRAINT sensor_current_state_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.instrument_metadata(sensor_id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sensor_id text NOT NULL,
  distance_km double precision,
  elevation_diff double precision,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_subscriptions_sensor_id_fkey FOREIGN KEY (sensor_id) REFERENCES public.instrument_metadata(sensor_id)
);