/*
  # Create Vehicle Management Database Schema

  1. New Tables
    - `vehicles`
      - `id` (uuid, primary key)
      - `created_at` (timestamp with time zone)
      - `license_plate` (text, unique)
      - `manufacture_year` (integer)
      - `user_id` (uuid, foreign key to auth.users)
    
    - `vehicle_details`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, foreign key to vehicles)
      - `soat_expiry` (date)
      - `tech_inspection_date` (date)
      - `next_tech_inspection_date` (date)
      - `fire_extinguisher_renewal` (date)
      - `current_mileage` (integer)
      - `tire_pressure` (text)
      - `updated_at` (timestamp with time zone)
    
    - `maintenance_records`
      - `id` (uuid, primary key)
      - `vehicle_id` (uuid, foreign key to vehicles)
      - `maintenance_date` (date)
      - `performed_by` (text)
      - `performed_at` (text)
      - `current_mileage` (integer)
      - `maintenance_type` (text, either 'regular' or 'additional')
      - `update_mileage` (boolean)
      - `notes` (text)
      - `created_at` (timestamp with time zone)
    
    - `maintenance_services`
      - `id` (uuid, primary key)
      - `maintenance_id` (uuid, foreign key to maintenance_records)
      - `service_description` (text)
      - `created_at` (timestamp with time zone)
    
    - `reminder_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `days_after_maintenance` (integer)
      - `created_at` (timestamp with time zone)
    
    - `users`
      - `id` (uuid, primary key, matches auth.users.id)
      - `email` (text, unique)
      - `created_at` (timestamp with time zone)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  license_plate TEXT UNIQUE NOT NULL,
  manufacture_year INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create vehicle_details table
CREATE TABLE IF NOT EXISTS vehicle_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  soat_expiry DATE,
  tech_inspection_date DATE,
  next_tech_inspection_date DATE,
  fire_extinguisher_renewal DATE,
  current_mileage INTEGER,
  tire_pressure TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vehicle_id)
);

-- Create maintenance_records table
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL,
  performed_by TEXT NOT NULL,
  performed_at TEXT NOT NULL,
  current_mileage INTEGER NOT NULL,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('regular', 'additional')),
  update_mileage BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create maintenance_services table
CREATE TABLE IF NOT EXISTS maintenance_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID NOT NULL REFERENCES maintenance_records(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reminder_settings table
CREATE TABLE IF NOT EXISTS reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days_after_maintenance INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create users table to track users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security for all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles
CREATE POLICY "Users can view their own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for vehicle_details
CREATE POLICY "Users can view details of their own vehicles"
  ON vehicle_details FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_details.vehicle_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert details for their own vehicles"
  ON vehicle_details FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_details.vehicle_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update details of their own vehicles"
  ON vehicle_details FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_details.vehicle_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete details of their own vehicles"
  ON vehicle_details FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = vehicle_details.vehicle_id
    AND vehicles.user_id = auth.uid()
  ));

-- Create policies for maintenance_records
CREATE POLICY "Users can view maintenance records of their own vehicles"
  ON maintenance_records FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = maintenance_records.vehicle_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert maintenance records for their own vehicles"
  ON maintenance_records FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = maintenance_records.vehicle_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update maintenance records of their own vehicles"
  ON maintenance_records FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = maintenance_records.vehicle_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete maintenance records of their own vehicles"
  ON maintenance_records FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vehicles
    WHERE vehicles.id = maintenance_records.vehicle_id
    AND vehicles.user_id = auth.uid()
  ));

-- Create policies for maintenance_services
CREATE POLICY "Users can view maintenance services of their own vehicles"
  ON maintenance_services FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM maintenance_records
    JOIN vehicles ON vehicles.id = maintenance_records.vehicle_id
    WHERE maintenance_records.id = maintenance_services.maintenance_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert maintenance services for their own vehicles"
  ON maintenance_services FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM maintenance_records
    JOIN vehicles ON vehicles.id = maintenance_records.vehicle_id
    WHERE maintenance_records.id = maintenance_services.maintenance_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can update maintenance services of their own vehicles"
  ON maintenance_services FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM maintenance_records
    JOIN vehicles ON vehicles.id = maintenance_records.vehicle_id
    WHERE maintenance_records.id = maintenance_services.maintenance_id
    AND vehicles.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete maintenance services of their own vehicles"
  ON maintenance_services FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM maintenance_records
    JOIN vehicles ON vehicles.id = maintenance_records.vehicle_id
    WHERE maintenance_records.id = maintenance_services.maintenance_id
    AND vehicles.user_id = auth.uid()
  ));

-- Create policies for reminder_settings
CREATE POLICY "Users can view their own reminder settings"
  ON reminder_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder settings"
  ON reminder_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder settings"
  ON reminder_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminder settings"
  ON reminder_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for users
CREATE POLICY "Users can view their own user info"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own user info"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create trigger function to update the updated_at field in vehicle_details
CREATE OR REPLACE FUNCTION update_vehicle_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp
CREATE TRIGGER set_vehicle_details_updated_at
BEFORE UPDATE ON vehicle_details
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_details_updated_at();

-- Create function to insert user into users table upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add user to users table on auth.user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();