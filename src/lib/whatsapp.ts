export async function sendWhatsAppMessage(toPhone: string, text: string): Promise<{ success: boolean; status: string; messageId?: string }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const isMock = !accessToken || !phoneId || accessToken === 'your-meta-access-token' || phoneId === 'your-meta-phone-number-id';

  // Format recipient phone: strip special characters except digits
  const cleanPhone = toPhone.replace(/\D/g, '');

  if (isMock) {
    console.log('\n\x1b[35m[WhatsApp Simulation Outbound]\x1b[0m');
    console.log(`To Phone: +${cleanPhone}`);
    console.log(`Body: "${text}"`);
    console.log('\x1b[35m====================================\x1b[0m\n');
    
    return {
      success: true,
      status: 'Sent (Mocked Simulation Mode)',
      messageId: `mock-msg-${Math.random().toString(36).substring(2, 10)}`,
    };
  }

  // Meta Cloud API Implementation
  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Meta Cloud API outbound WhatsApp error:', errorText);
      return { success: false, status: 'Failed Meta API request' };
    }

    const data = await response.json();
    return {
      success: true,
      status: 'Sent (Meta Cloud API)',
      messageId: data.messages?.[0]?.id,
    };
  } catch (error: any) {
    console.error('Meta Cloud API request failed:', error);
    return { success: false, status: error.message || 'API request error' };
  }
}
