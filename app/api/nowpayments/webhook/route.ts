import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with the Service Role Key to bypass RLS in the background
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Get the IPN signature from the headers
    const signature = req.headers.get('x-nowpayments-sig');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 2. Read the raw text body for verification
    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);

    // 3. Verify the signature using your NOWPayments IPN Secret
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET!;
    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(bodyText);
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
      console.error("Invalid NOWPayments signature");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Crypto Payment Update: ${payload.payment_status} for Order: ${payload.order_id}`);

    // 4. Process the payment ONLY if it is completely finished
    if (payload.payment_status === 'finished') {
      
      // The order_id should be the user's ID that we pass when creating the payment link
      const userId = payload.order_id; 

      // 5. UPDATE YOUR DATABASE
      // 👇 IMPORTANT: Change 'profiles' to your actual table name from the screenshot
      // 👇 Change 'plan_type' to your actual premium status column name
      const { error } = await supabase
        .from('profiles') 
        .update({ 
          plan_type: 'premium', // Or is_premium: true, etc.
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      console.log(`Successfully upgraded user: ${userId}`);
    }

    // Always return a 200 OK so NOWPayments knows you received the webhook
    return NextResponse.json({ status: 'OK' }, { status: 200 });

  } catch (error) {
    console.error("NOWPayments Webhook Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
