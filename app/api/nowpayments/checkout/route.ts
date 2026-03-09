import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { planName, price, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User must be logged in' }, { status: 401 });
    }

    // Call NOWPayments API to create an invoice
    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: price,
        price_currency: 'usd',
        order_id: userId, // CRITICAL: This tells the webhook who to upgrade later!
        order_description: `Neural Capacity - ${planName} Plan`,
        ipn_callback_url: 'https://your-domain.com/api/nowpayments/webhook',
        success_url: 'https://your-domain.com/dashboard/settings?payment=success',
        cancel_url: 'https://your-domain.com/dashboard/settings?payment=cancelled',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create invoice');
    }

    // Return the secure checkout link to the frontend
    return NextResponse.json({ checkout_url: data.invoice_url });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
