// --- Imports ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// --- Import Database Models ---
const User = require('./models/User');
const Chat = require('./models/Chat');

// --- Import Middleware and Routes ---
const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// --- Initializations ---
const app = express();
const PORT = process.env.PORT || 5000;
const PYTHON_API_URL = 'http://localhost:5001/ask';

// --- Database Connection ---
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected...');
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};
connectDB();

// --- Middleware Setup ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable the express server to accept and parse JSON bodies

// --- API Routes ---
app.use('/api/auth', authRoutes); // All routes in auth.js will be prefixed with /api/auth
app.use('/api/chats', chatRoutes); // All routes in chat.js will be prefixed with /api/chats

// --- Core Chatbot Interaction Route ---
// This is the main endpoint the frontend will call to get an answer.
app.post('/api/ask', authMiddleware, async (req, res) => {
  const { query, chatId } = req.body;
  const userId = req.user.id;

  if (!query) {
    return res.status(400).json({ msg: 'Query is required.' });
  }

  try {
    // 1. Get the answer from the Python ML service
    console.log(`Forwarding query to Python ML service: "${query}"`);
    const mlResponse = await axios.post(PYTHON_API_URL, { query });
    const botAnswer = mlResponse.data.answer;
    console.log('Received answer from Python ML service.');

    // 2. Find the current chat or create a new one
    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
    } else {
      // If no chatId is provided, create a new chat session
      chat = new Chat({ userId, messages: [] });
    }

    if (!chat) {
      return res.status(404).json({ msg: 'Chat not found.' });
    }

    // Ensure the user owns this chat
    if (chat.userId.toString() !== userId) {
      return res.status(401).json({ msg: 'User not authorized for this chat.' });
    }

    // 3. Add the user's question and the bot's answer to the messages array
    chat.messages.push({ sender: 'user', text: query });
    chat.messages.push({ sender: 'bot', text: botAnswer });

    // If it's a new chat, set a title based on the first query
    if (!chatId) {
        chat.title = query.substring(0, 30); // Use first 30 chars as a title
    }

    await chat.save();
    console.log('Conversation saved to database.');

    // 4. Send the bot's answer and the new chat ID back to the frontend
    res.json({ answer: botAnswer, chatId: chat._id });

  } catch (error) {
    console.error("❌ Error in /api/ask route:", error.message);
    if (error.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: "Could not connect to the Python ML service. Is it running?" });
    }
    res.status(500).json({ error: 'Server error while getting an answer.' });
  }
});

// --- Start Server ---
app.listen(PORT, () => console.log(`🚀 Backend server running on port ${PORT}`));