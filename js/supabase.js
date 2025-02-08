import { createClient } from '@supabase/supabase-js'

// 直接写入Supabase配置
const SUPABASE_URL = "https://jzpcrdvffrpdyuetbefb.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cGNyZHZmZnJwZHl1ZXRiZWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MzY1MzQsImV4cCI6MjA1NDUxMjUzNH0.0IRrxVdeKtbrfFyku0CvXsyeAtYp1mXXxLvyEQ6suTM";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
import { createClient } from '@supabase/supabase-js'