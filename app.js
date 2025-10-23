if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash')
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');
const { createServer } = require("http");
const { Server } = require("socket.io");
const chatRoutes = require('./routes/chat');

const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users');
const cafeRoutes = require('./routes/cafes');
const reviewRoutes = require('./routes/reviews');

const MongoStore = require('connect-mongo');

// const dbUrl = process.env.DB_URL;
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-cafe';

mongoose.connect(dbUrl);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(mongoSanitize());
app.use('/chat', chatRoutes);

app.use((req, res, next) => {
    if (req.body) {
        req.body = mongoSanitize.sanitize(req.body);
    }
    next();
});

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR");
});

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet({contentSecurityPolicy:false}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// process.on('warning', (warning) => {
//     console.log(warning.stack);
// });

app.use((req,res,next) => {
    // console.log(req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use('/', userRoutes);
app.use('/cafes', cafeRoutes);
app.use('/cafes/:id/reviews', reviewRoutes);

app.get('/', (req,res) => {
    res.render('home');
});

app.all(/(.*)/, (req,res,next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err,req,res,next) => {
    const {statusCode=500} = err;
    if (!err.message) err.message = 'Oh no, something went wrong.';
    res.status(statusCode).render('error', {err});
});


const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? 'study-cafe-recs.onrender.com'
            : 'http://localhost:3000',
        methods: ["GET", "POST"]
    }
});

// Make io accessible in routes
app.set('io', io);

// // Socket.io middleware for authentication
// io.use((socket, next) => {
//     const sessionMiddleware = session(sessionConfig);
//     sessionMiddleware(socket.request, {}, () => {
//         if (socket.request.session && socket.request.session.passport) {
//             User.findById(socket.request.session.passport.user)
//                 .then(user => {
//                     socket.user = user;
//                     next();
//                 })
//                 .catch(err => next(new Error('Authentication error')));
//         } else {
//             next(new Error('Not authenticated'));
//         }
//     });
// });

// Online users tracking
const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('🔌 New socket connection:', socket.id);

    // Store username temporarily
    let username = null;
    let userId = null;

    // Handle user authentication
    socket.on('authenticate', (data) => {
        username = data.username;
        userId = data.userId;

        console.log('✅ User authenticated:', username);

        // Add to online users
        onlineUsers.set(userId, {
            username: username,
            socketId: socket.id
        });

        // ✅ Auto-join global chat on server side
        socket.join('global-chat');
        console.log(`${username} joined global-chat`);

        // Send updated online users to all clients
        io.emit('onlineUsers', Array.from(onlineUsers.values()));

        // Confirm authentication
        socket.emit('authenticated');
    });

    // Join cafe room
    socket.on('joinCafe', (cafeId) => {
        socket.join(`cafe-${cafeId}`);
        console.log(`${username} joined cafe-${cafeId}`);
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
        if (!username) {
            console.log('⚠️ Unauthenticated user tried to send message');
            return;
        }

        console.log('📩 Message from', username, ':', data.text);

        const message = {
            id: Date.now(),
            text: data.text,
            username: username,
            userId: userId,
            timestamp: new Date(),
            room: data.room || 'global-chat'
        };

        console.log('📤 Broadcasting to room:', message.room);

        // Broadcast to everyone in the room (including sender)
        io.to(message.room).emit('chatMessage', message);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        if (!username) return;

        socket.to(data.room).emit('userTyping', {
            username: username,
            isTyping: data.isTyping
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        if (userId) {
            console.log('❌ User disconnected:', username);
            onlineUsers.delete(userId);
            io.emit('onlineUsers', Array.from(onlineUsers.values()));
        }
    });
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log(`Serving on port ${port}`);
});

//
// app.listen(3000, ()=> {
//     console.log('Serving on port 3000');
// });