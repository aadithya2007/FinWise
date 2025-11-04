const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/authMiddleware'); // We'll create this next

// --- Get all chats for the logged-in user ---
// @route   GET /api/chats
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Find chats and sort by most recent
    const chats = await Chat.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Get a specific chat with all its messages ---
// @route   GET /api/chats/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat || chat.userId.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Chat not found' });
    }
    res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;