const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    text: {
        type: String,
        required: true,
        maxlength: 500
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cafe: {
        type: Schema.Types.ObjectId,
        ref: 'Cafe'
    },
    room: {
        type: String,
        default: 'global-chat'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);