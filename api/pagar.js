export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nombre, email, telefono, modalidad, precio } = req.body;

  if (!nombre || !email || !precio) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  const baseUrl = 'https://taller-ia-dobleads.vercel.app';

  const preference = {
    items: [
      {
        title: `Taller de Comerciales con IA · ${modalidad}`,
        quantity: 1,
        unit_price: Number(precio),
        currency_id: 'MXN',
      }
    ],
    payer: {
      name: nombre,
      email: email,
      phone: { number: String(telefono || '') },
    },
    payment_methods: {
      installments: 12,
    },
    back_urls: {
      success: `${baseUrl}?status=success&nombre=${encodeURIComponent(nombre)}&modalidad=${encodeURIComponent(modalidad)}&email=${encodeURIComponent(email)}`,
      failure: `${baseUrl}?status=failure`,
      pending: `${baseUrl}?status=pending&nombre=${encodeURIComponent(nombre)}&modalidad=${encodeURIComponent(modalidad)}&email=${encodeURIComponent(email)}`,
    },
    auto_return: 'approved',
    statement_descriptor: 'DOBLE ADS TALLER',
    external_reference: `${email}-${Date.now()}`,
  };

  try {
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('MP error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Error al crear preferencia', detail: data });
    }

    return res.status(200).json({ init_point: data.init_point, id: data.id });

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: 'Error interno del servidor', message: err.message });
  }
}
