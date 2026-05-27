DECLARE
  old_level integer;
  new_level integer;
  trend_val text;
  n8n_url text;
BEGIN
  -- 1. Ambil URL Webhook n8n
  SELECT value INTO n8n_url FROM public.app_settings WHERE key = 'n8n_webhook_url';
  
  -- 2. Ambil status warning level terakhir (default 0 jika data baru)
  SELECT COALESCE(current_warning_level, 0) INTO old_level
  FROM public.sensor_current_state WHERE sensor_id = NEW.sensor_id;
  
  new_level := NEW.warning_level;

  -- 3. Hitung tren dengan konversi tipe data ke NUMERIC agar matematika regresi akurat
  WITH points AS (
    SELECT value,
           (row_number() OVER (ORDER BY measured_at ASC) - 1)::numeric as x 
    FROM public.obs_data
    WHERE sensor_id = NEW.sensor_id
      AND measured_at > (NEW.measured_at - interval '3 hours')
    ORDER BY measured_at ASC
  ),
  stats AS (
    SELECT
      COUNT(*)::numeric as n, 
      SUM(x)     as sum_x,
      SUM(value) as sum_y,
      SUM(x * value) as sum_xy,
      SUM(x * x)     as sum_x2
    FROM points
  )
  SELECT CASE
    WHEN n < 3 THEN 'stabil'
    WHEN (n * sum_x2 - sum_x * sum_x) = 0 THEN 'stabil'
    WHEN (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) > 0.005 THEN 'naik'
    WHEN (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) < -0.005 THEN 'turun'
    ELSE 'stabil'
  END INTO trend_val
  FROM stats;

  -- 4. Jalankan Upsert (Insert atau Update jika konflik)
  INSERT INTO public.sensor_current_state (
    sensor_id, current_warning_level, previous_warning_level,
    current_value, previous_value, last_changed_at, last_updated_at, trend_3h
  ) VALUES (
    NEW.sensor_id, new_level, old_level,
    NEW.value,
    NEW.value, -- Default awal untuk data baru yang belum punya riwayat
    NEW.measured_at, -- Sensor baru langsung dicap dengan waktu saat ini
    NEW.measured_at,
    trend_val
  )
  ON CONFLICT (sensor_id) DO UPDATE SET
    previous_warning_level = public.sensor_current_state.current_warning_level,
    current_warning_level = new_level,
    previous_value = public.sensor_current_state.current_value,
    current_value = NEW.value,
    last_changed_at = CASE
      -- FIX: Menggunakan data asli tabel saat ini untuk validasi perubahan status
      WHEN new_level != public.sensor_current_state.current_warning_level THEN NEW.measured_at
      ELSE public.sensor_current_state.last_changed_at
    END,
    last_updated_at = NEW.measured_at,
    trend_3h = trend_val;

  -- 5. Tembak HTTP Post ke n8n secara real-time hanya jika status level bahaya berubah
  IF new_level != old_level AND n8n_url IS NOT NULL THEN
    PERFORM net.http_post(
      url := n8n_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'sensor_id', NEW.sensor_id,
        'old_level', old_level,
        'new_level', new_level,
        'value', NEW.value,
        'measured_at', NEW.measured_at,
        'trend_3h', trend_val
      )
    );
  END IF;

  RETURN NEW;
END;