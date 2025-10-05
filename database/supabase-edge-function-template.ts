// ============================================================================
// SUPABASE EDGE FUNCTION: Class Generation Webhook
// ============================================================================
// This Edge Function calls the Next.js API endpoints for class generation
// Deploy this to Supabase Edge Functions to enable automated class generation
// ============================================================================

// To deploy this function:
// 1. Install Supabase CLI: npm install -g supabase
// 2. Login: supabase login
// 3. Link your project: supabase link --project-ref your-project-ref
// 4. Deploy: supabase functions deploy class-generation-webhook
// 5. Set secrets: supabase secrets set NEXTJS_API_URL=https://your-domain.com

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ============================================================================
// Configuration
// ============================================================================

const NEXTJS_API_URL = Deno.env.get('NEXTJS_API_URL') || 'http://localhost:3000'
const API_SECRET = Deno.env.get('API_SECRET') // Optional: for securing your API

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Parse request body
    const body = await req.json()
    const { operation, studentId, type } = body

    console.log('Class generation webhook triggered:', { operation, studentId, type })

    let endpoint = ''
    let requestBody = {}

    // Determine which endpoint to call based on operation type
    switch (type) {
      case 'student-insert':
      case 'student-update':
        // Generate missing classes for a specific student
        endpoint = '/api/class-tracking/generate-missing-classes'
        requestBody = { studentId }
        break

      case 'weekly-generation':
        // Generate classes for the current week
        endpoint = '/api/class-tracking/generate-weekly-classes'
        requestBody = {}
        break

      default:
        throw new Error(`Unknown operation type: ${type}`)
    }

    // Call the Next.js API endpoint
    const apiUrl = `${NEXTJS_API_URL}${endpoint}`
    console.log('Calling API:', apiUrl)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Add API secret if configured
    if (API_SECRET) {
      headers['Authorization'] = `Bearer ${API_SECRET}`
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} - ${JSON.stringify(data)}`)
    }

    console.log('API call successful:', data)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Class generation completed successfully',
        data,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in class generation webhook:', error)

    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      }
    )
  }
})

// ============================================================================
// Deployment Instructions
// ============================================================================

/*
1. Install Supabase CLI:
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref your-project-ref

4. Create the function directory:
   mkdir -p supabase/functions/class-generation-webhook
   
5. Copy this file to:
   supabase/functions/class-generation-webhook/index.ts

6. Deploy the function:
   supabase functions deploy class-generation-webhook

7. Set environment variables:
   supabase secrets set NEXTJS_API_URL=https://your-domain.com
   supabase secrets set API_SECRET=your-secret-key (optional)

8. Test the function:
   curl -X POST https://your-project-ref.supabase.co/functions/v1/class-generation-webhook \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"type":"student-insert","studentId":1}'

9. Schedule the weekly generation:
   - Go to Supabase Dashboard > Edge Functions
   - Create a new scheduled function
   - Set schedule: "0 6 * * 1" (Every Monday at 6:00 AM)
   - Set function URL: https://your-project-ref.supabase.co/functions/v1/class-generation-webhook
   - Set body: {"type":"weekly-generation"}

10. Update your database triggers to call this Edge Function:
    - Modify the trigger_class_generation function in supabase-triggers-and-functions.sql
    - Use Supabase's net.http_post to call the Edge Function
*/

// ============================================================================
// Example: Calling from Database Trigger
// ============================================================================

/*
-- Update the trigger_class_generation function to call the Edge Function

CREATE OR REPLACE FUNCTION public.trigger_class_generation(
    p_student_id INTEGER,
    p_operation TEXT DEFAULT 'insert'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_edge_function_url TEXT;
    v_response TEXT;
BEGIN
    -- Get student data
    SELECT * INTO v_student
    FROM public.students
    WHERE id = p_student_id;
    
    -- Only proceed if student has start_date and fixed_schedule
    IF v_student.start_date IS NULL OR v_student.fixed_schedule IS NULL THEN
        RAISE NOTICE 'Student % does not have start_date or fixed_schedule, skipping class generation', p_student_id;
        RETURN;
    END IF;
    
    -- Set Edge Function URL
    v_edge_function_url := 'https://your-project-ref.supabase.co/functions/v1/class-generation-webhook';
    
    -- Call the Edge Function
    SELECT content::text INTO v_response
    FROM http((
        'POST',
        v_edge_function_url,
        ARRAY[http_header('Content-Type', 'application/json')],
        'application/json',
        json_build_object(
            'type', CASE WHEN p_operation = 'insert' THEN 'student-insert' ELSE 'student-update' END,
            'studentId', p_student_id,
            'operation', p_operation
        )::text
    )::http_request);
    
    RAISE NOTICE 'Edge Function called for student %: %', p_student_id, v_response;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error calling Edge Function for student %: %', p_student_id, SQLERRM;
END;
$$;
*/
