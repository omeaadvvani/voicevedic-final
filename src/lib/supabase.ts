import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Log warning if using placeholder values
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Using placeholder Supabase credentials. App will run but database features won\'t work.');
  console.warn('To enable full functionality, create a .env.local file with your Supabase credentials.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          pin_hash: string;
          calendar_tradition: string;
          preferred_language: string;
          selected_rituals: string[];
          notification_time: string;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          pin_hash: string;
          calendar_tradition: string;
          preferred_language: string;
          selected_rituals: string[];
          notification_time: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          pin_hash?: string;
          calendar_tradition?: string;
          preferred_language?: string;
          selected_rituals?: string[];
          notification_time?: string;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          language: string;
          calendar_type: string;
          location: string | null;
          notification_time: string | null;
          timezone: string | null;
          device_type: string | null;
          is_active: boolean;
          updated_by_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          language: string;
          calendar_type: string;
          location?: string | null;
          notification_time?: string | null;
          timezone?: string | null;
          device_type?: string | null;
          is_active?: boolean;
          updated_by_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          language?: string;
          calendar_type?: string;
          location?: string | null;
          notification_time?: string | null;
          timezone?: string | null;
          device_type?: string | null;
          is_active?: boolean;
          updated_by_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}