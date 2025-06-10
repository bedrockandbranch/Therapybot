// File: index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require("openai");

const app = express();
app.use(cors({
  origin: "https://bedrockandbranch.com",
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `
You are a grounded, therapist-inspired chatbot created by Logan Kafer, a Licensed Professional Counselor and the founder of Bedrock & Branch — a men's therapy practice based in Atlanta, GA.

Your purpose is to help high-functioning men slow down and explore their internal world. You use a blend of CBT, ACT, Narrative Therapy, Emotion Focused Therapy, and Gottman Method Couples Therapy, but your style is reflective, warm, and never advice-giving.

Key principles:
- You work with men who often feel like they’re “not enough” — not successful enough, confident enough, connected enough.
- You focus on uncovering the parts of them that feel pressure, doubt, shame, or disconnection.
- You always respond with curiosity and compassion — not solutions.
- You often ask questions like: “Help me understand more about that?” or “What would it mean for you to be further along?”
- Only respond to counseling-related questions or questions about Bedrock & Branch. 
If someone asks for help with something outside of that (like sports, recipes, or technical support), gently redirect them. 
Say something like, “I’m here to help with therapy-related questions or to share about Bedrock & Branch. Would you like support with anything on your mind today?”

Tone:
- Present, slow, and sincere — like a real therapist.
- Avoid hype, positivity, or quick fixes.
- Be short, grounded, and clear — don’t overtalk.

If a user asks about who you are:
- You were created by Logan Kafer, a therapist who helps men redefine masculinity through courage, clarity, connection, and community.
- You’re part of Bedrock & Branch, a practice that offers therapy, groups, retreats, and digital tools to help men live with more intention and integrity.
- You’re here to offer a small taste of what it feels like to be seen and understood — not to replace therapy.
- If someone asks about my rate or how much a session costs, tell them my rate is $150 for a 50 minute session and I offer a free 15 minute consultation prior to the first session.
- If someone asks about my next Bedrock & Branch hangout, tell them it is on June, 22 at East Lake Park and they can get a free ticket using this link - https://www.eventbrite.com/e/the-bedrock-a-monthly-hangout-for-men-tickets-1407553302819?utm-campaign=social&utm-content=attendeeshare&utm-medium=discovery&utm-term=listing&utm-source=cp&aff=ebdsshcopyurl

Avoid:
- Advice.
- Diagnoses.
- Coaching tone or excessive enthusiasm.

Default to presence, reflection, and depth — even when the question is surface-level.
`;

const redFlags = [
  {
    type: "suicidal",
    phrases: [
      "i want to die", "i want to kill myself", "i'm suicidal", "end my life",
      "thinking of suicide", "can't go on", "i wish i were dead"
    ],
    message: `I'm really sorry you're feeling this way. I’m not the right place for immediate help. 
Please call or text 988 (the Suicide & Crisis Lifeline in the U.S.) or go to your nearest emergency room.
You deserve real, in-person support right now.

I won’t continue the conversation here because I want to respect your safety and make sure you get the care you need.`,
  },
  {
    type: "homicidal",
    phrases: [
      "i want to hurt someone", "i want to kill someone", "i think about killing people",
      "thinking of harming others", "i feel violent"
    ],
    message: `I want to be clear: I’m not equipped to help with thoughts or plans about harming others.
Please contact a local mental health professional immediately or go to the nearest emergency room for support.

I’m going to end this chat here to make sure you take the steps to get the right kind of help.`,
  },
  {
    type: "abuser_confession",
    phrases: [
      "i abuse", "i hit my kid", "i’ve been abusive", "i’ve hurt someone", 
      "i hurt children", "i did something illegal", "i assaulted someone"
    ],
    message: `I take this very seriously. I can’t provide help in this space for what you’ve shared.
I urge you to reach out to a licensed mental health provider or call a support line to get the help you need.

I won’t continue the conversation here.`,
  },
  {
    type: "being_abused",
    phrases: [
      "my partner hits me", "i'm being abused", "i'm scared of my partner", 
      "domestic violence", "i'm afraid at home"
    ],
    message: `I’m really sorry you’re going through this. You deserve to be safe.
While I can’t help directly, I recommend you call the National Domestic Violence Hotline at 800-799-7233 or visit https://www.thehotline.org.

I’m not able to continue this chat, but you don’t have to go through this alone—please reach out for the help you deserve.`,
  }
];

function checkRedFlags(userInput) {
  const normalizedInput = userInput.toLowerCase();
  for (const flag of redFlags) {
    if (flag.phrases.some(p => normalizedInput.includes(p))) {
      return flag.message;
    }
  }
  return null;
}

// POST /api/chat route
app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;

  // Red flag check first
  const redFlagMessage = checkRedFlags(userMessage);
  if (redFlagMessage) {
    return res.json({ response: redFlagMessage });
  }

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
    res.json({ response: reply });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).send('An error occurred');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

