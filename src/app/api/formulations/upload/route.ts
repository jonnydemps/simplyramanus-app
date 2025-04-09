import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
// Removed incorrect import: import { createFormulation } from '@/lib/supabase';

// Supabase URL needed for service client initialization inside handler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Removed unused Anon client initialization

// Service role client will be initialized inside the handler

export async function POST(request: NextRequest) {
  try {
    // Initialize service role client *inside* the handler
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase URL or Service Role Key is missing.');
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user using the service client (or anon client if appropriate)
    // Using service client here for consistency, assuming RLS might not be fully set up for anon key access to user data
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Use getUser with service key

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;
    
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const productType = formData.get('productType') as string;
    
    if (!file || !name || !productType) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }
    
    // Convert file to array buffer for parsing
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert worksheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Excel file is empty or has invalid format' },
        { status: 400 }
      );
    }
    
    // Upload file to Supabase Storage
    const fileBuffer = Buffer.from(arrayBuffer);
    const filePath = `formulations/${userId}/${Date.now()}_${file.name}`;
    
    const { error: fileError } = await supabase.storage
      .from('formulations')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (fileError) {
      console.error('File upload error:', fileError);
      return NextResponse.json(
        { message: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Create formulation record in database using the supabase client
    const { data: newFormulation, error: formulationError } = await supabase
      .from('formulations') // Assuming the table name is 'formulations'
      .insert({
        user_id: userId,
        name,
        description,
        product_type: productType,
        original_file_name: file.name,
        file_path: filePath,
        status: 'pending', // Default status
        payment_status: 'unpaid', // Default payment status
      })
      .select() // Select the newly created record
      .single(); // Expect only one record
    
    if (formulationError) {
      console.error('Formulation creation error:', formulationError);
      return NextResponse.json(
        { message: 'Failed to create formulation record' },
        { status: 500 }
      );
    }
    
    // Process ingredients from Excel file
    // This would be implemented to extract ingredients and add them to the database
    
    return NextResponse.json({
      message: 'Formulation uploaded successfully',
      id: newFormulation.id, // Use the id from the newly created record
    });
  } catch (error) {
    console.error('Formulation upload error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
