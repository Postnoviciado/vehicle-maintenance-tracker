export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string
          created_at: string
          license_plate: string
          manufacture_year: number
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          license_plate: string
          manufacture_year: number
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          license_plate?: string
          manufacture_year?: number
          user_id?: string
        }
      }
      vehicle_details: {
        Row: {
          id: string
          vehicle_id: string
          soat_expiry: string | null
          tech_inspection_date: string | null
          next_tech_inspection_date: string | null
          fire_extinguisher_renewal: string | null
          current_mileage: number | null
          tire_pressure: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          soat_expiry?: string | null
          tech_inspection_date?: string | null
          next_tech_inspection_date?: string | null
          fire_extinguisher_renewal?: string | null
          current_mileage?: number | null
          tire_pressure?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          soat_expiry?: string | null
          tech_inspection_date?: string | null
          next_tech_inspection_date?: string | null
          fire_extinguisher_renewal?: string | null
          current_mileage?: number | null
          tire_pressure?: string | null
          updated_at?: string
        }
      }
      maintenance_records: {
        Row: {
          id: string
          vehicle_id: string
          maintenance_date: string
          performed_by: string
          performed_at: string
          current_mileage: number
          maintenance_type: 'regular' | 'additional'
          update_mileage: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          maintenance_date: string
          performed_by: string
          performed_at: string
          current_mileage: number
          maintenance_type: 'regular' | 'additional'
          update_mileage?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          maintenance_date?: string
          performed_by?: string
          performed_at?: string
          current_mileage?: number
          maintenance_type?: 'regular' | 'additional'
          update_mileage?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      maintenance_services: {
        Row: {
          id: string
          maintenance_id: string
          service_description: string
          created_at: string
        }
        Insert: {
          id?: string
          maintenance_id: string
          service_description: string
          created_at?: string
        }
        Update: {
          id?: string
          maintenance_id?: string
          service_description?: string
          created_at?: string
        }
      }
      reminder_settings: {
        Row: {
          id: string
          user_id: string
          days_after_maintenance: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          days_after_maintenance: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          days_after_maintenance?: number
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}