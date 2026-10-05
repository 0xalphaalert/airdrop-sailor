import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function editMessage(chatId, messageId, newText) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text: newText })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ status: 'ok' });

  try {
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).json({ status: 'ok' });

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (message.reply_to_message) {
      const originalText = message.reply_to_message.text;
      const idMatch = originalText.match(/ID:\s*([a-fA-F0-9-]+)/);
      
      if (idMatch) {
        const projectId = idMatch[1];
        const xLink = text; 

        const handleMatch = xLink.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i);
        const handle = handleMatch ? handleMatch[1] : null;

        if (!handle) {
           await sendMessage(chatId, '⚠️ Could not extract X handle. Please paste a valid x.com link.');
           return res.status(200).json({ status: 'ok' });
        }

        const logoUrl = `https://unavatar.io/twitter/${handle}`;

        // ✅ CORRECT: Aligned with your Edge Function schema
        const { error } = await supabase
          .from('funding_opportunities')
          .update({ 
             x_link: xLink, 
             project_logo: logoUrl 
          })
          .eq('id', projectId);
        if (error) throw error;

        const originalMessageId = message.reply_to_message.message_id;
        await editMessage(
          chatId, 
          originalMessageId, 
          `✅ **Resolved:** X Link & Logo added!\nID: ${projectId}\nLogo: ${logoUrl}`
        );
        
        return res.status(200).json({ status: 'ok' });
      }
    }

    if (text === '/start') {
       await sendMessage(chatId, '⚓ Sailor Pending Queue is ready. Reply to missing data alerts to clear them.');
    }

  } catch (error) {
    console.error("Bot Error:", error);
  }

  res.status(200).json({ status: 'ok' });
}
