import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // FIX 1: Extract 'plan' instead of 'planName' to match the frontend payload
    const { plan, price, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User must be logged in' }, { status: 401 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-project-memory.vercel.app';

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: price,
        price_currency: 'usd',
        order_id: userId,
        order_description: `Neural Capacity - ${plan} Plan`, // Updated to use 'plan'
        ipn_callback_url: `${siteUrl}/api/nowpayments/webhook`,
        success_url: `${siteUrl}/dashboard/settings?payment=success`,
        cancel_url: `${siteUrl}/dashboard/settings?payment=cancelled`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create invoice');
    }

    // FIX 2: Return 'invoiceUrl' instead of 'checkout_url' so the frontend recognizes it
    return NextResponse.json({ invoiceUrl: data.invoice_url });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
