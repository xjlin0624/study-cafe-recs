const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const {cafeSchema} = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Cafe = require('./models/cafe');

mongoose.connect('mongodb://localhost:27017/yelp-cafe');

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

const validateCafe = (req,res,next) => {
    const {error} = cafeSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

app.get('/', (req,res) => {
    res.render('home');
});

app.get('/cafes', catchAsync(async (req,res) => {
    const cafes = await Cafe.find({});
    res.render('cafes/index', {cafes});
}));

app.get('/cafes/new', (req,res) => {
    res.render('cafes/new');
});

app.post('/cafes', validateCafe, catchAsync(async (req,res,next) => {
    const cafe = new Cafe(req.body.cafe);
    await cafe.save();
    res.redirect(`/cafes/${cafe._id}`);
}));

app.get('/cafes/:id', catchAsync(async (req,res,) => {
    const cafe = await Cafe.findById(req.params.id);
    res.render('cafes/show', {cafe});
}));

app.get('/cafes/:id/edit', catchAsync(async (req,res) => {
    const cafe = await Cafe.findById(req.params.id);
    res.render('cafes/edit', {cafe});
}));

app.put('/cafes/:id', validateCafe, catchAsync(async (req,res) => {
    const {id} = req.params;
    const cafe = await Cafe.findByIdAndUpdate(id,{...req.body.cafe});
    res.redirect(`/cafes/${cafe._id}`);
}));

app.delete('/cafes/:id', catchAsync(async (req,res) => {
    const {id} = req.params;
    await Cafe.findByIdAndDelete(id);
    res.redirect('/cafes');
}));

app.all(/(.*)/, (req,res,next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err,req,res,next) => {
    const {statusCode=500} = err;
    if (!err.message) err.message = 'Oh no, something went wrong.';
    res.status(statusCode).render('error', {err});
});

app.listen(3000, ()=> {
    console.log('Serving on port 3000');
});