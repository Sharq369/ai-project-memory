import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-nowpayments-sig');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const bodyText = await req.text();
    const payload = JSON.parse(bodyText);

    // NOWPayments requires signature verified against SORTED JSON keys
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET!;
    const sortedPayload = JSON.stringify(
      Object.fromEntries(Object.entries(payload).sort())
    );
    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(sortedPayload);
    const calculatedSignature = hmac.digest('hex');

    if (signature !== calculatedSignature) {
      console.error("Invalid NOWPayments signature");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`Crypto Payment: ${payload.payment_status} for Order: ${payload.order_id}`);

    if (payload.payment_status === 'finished') {
      const userId = payload.order_id;

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          plan_type: 'premium',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.error('DB Update Error:', error);
        throw error;
      }

      console.log(`Successfully upgraded user: ${userId}`);
    }

    return NextResponse.json({ status: 'OK' }, { status: 200 });

  } catch (error) {
    console.error("NOWPayments Webhook Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
