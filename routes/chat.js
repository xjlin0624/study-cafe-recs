const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const { isLoggedIn } = require('../middleware');
//
// // Get recent messages for a room
// router.get('/messages/:room', isLoggedIn, async (req, res) => {
//     try {
//         const messages = await Message.find({ room: req.params.room })
//             .populate('author', 'username')
//             .sort({ timestamp: -1 })
//             .limit(50);
//         res.json(messages.reverse());
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to fetch messages' });
//     }
// });
//
// // Save message (called from socket handler)
// router.post('/messages', isLoggedIn, async (req, res) => {
//     try {
//         const message = new Message({
//             text: req.body.text,
//             author: req.user._id,
//             room: req.body.room,
//             cafe: req.body.cafeId
//         });
//         await message.save();
//         res.json({ success: true, message });
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to save message' });
//     }
// });

// Simplified - return empty array if no Message model yet
router.get('/messages/:room', (req, res) => {
    console.log('Fetching messages for room:', req.params.room);

    // For now, just return empty array
    // Later we can add Message.find() when model is ready
    res.json([]);
});

module.exports = router;

module.exports = router;