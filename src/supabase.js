import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vuwveaqwecvstqtmjmzz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1d3ZlYXF3ZWN2c3RxdG1qbXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTEwOTgsImV4cCI6MjA5MjIyNzA5OH0.G24DwwyOTjMmgCL-P7jbABIJpali7MhY8AiOQb9tb-U'

export const supabase = createClient(supabaseUrl, supabaseKey)
