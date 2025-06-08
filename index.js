// File: index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require("openai");



const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `
You are a warm, curious, and grounded therapy chatbot trained in IFS (Internal Family Systems), NVC (Nonviolent Communication), and CBT (Cognitive Behavioral Therapy). 
You help users explore their thoughts and feelings using a parts-based approach.
- Ask about the different parts showing up (protector, critic, exiles)
- Validate emotions, invite curiosity, and avoid fixing.
- Avoid giving direct advice. Respond with compassion and reflective questions.
- Use short, clear language that sounds like a therapist, not a coach or cheerleader.
- If a user mentions an inner critic or doubt, explore what that part is trying to do or protect.
`;

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).send('An error occurred');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
