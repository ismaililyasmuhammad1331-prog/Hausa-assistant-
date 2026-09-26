export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY ba ta an saita ba a Vercel.' });
    return;
  }

  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Ana bukatar "message" a cikin request.' });
    return;
  }

  const priorMessages = Array.isArray(history) ? history.slice(-10) : [];

  const systemPrompt = `Kai wani mataimaki ne mai suna "Hausa Assistant". Kana amsa koyaushe a harshen Hausa
sai dai idan mai amfani ya rubuta a wani harshe daban ya kuma nemi a amsa masa a wannan harshe.
Kana taimakawa da: fassara Hausa da Turanci, taimako a fannin karatu/aikin gida, rubuta sakonni
(wasiku, email, sakonnin WhatsApp), da amsa tambayoyin yau da kullum. Ka kasance mai sauki, taimako,
da kuma amfani da misalai idan ya dace. Ka rika amsawa a takaice kuma a fili.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          ...priorMessages,
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(response.status).json({ error: 'Claude API ta ki amsawa', detail: errText });
      return;
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const reply = textBlock ? textBlock.text : 'Yi hakuri, ban samu amsa ba a wannan karo.';

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Kuskure a server', detail: String(err) });
  }
}
