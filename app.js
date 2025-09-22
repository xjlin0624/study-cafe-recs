const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const Cafe = require('./models/cafe')

mongoose.connect('mongodb://localhost:27017/yelp-cafe');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

app.get('/', (req,res) => {
    res.render('home');
});

app.get('/cafes', async (req,res) => {
    const cafes = await Cafe.find({});
    res.render('cafes/index', {cafes});
});

app.get('/cafes/new', (req,res) => {
    res.render('cafes/new');
});

app.post('/cafes', async (req,res) => {
    const cafe = new Cafe(req.body.cafe);
    await cafe.save();
    res.redirect(`/cafes/${cafe._id}`);
});

app.get('/cafes/:id', async (req,res,) => {
    const cafe = await Cafe.findById(req.params.id);
    res.render('cafes/show', {cafe});
});

app.get('/cafes/:id/edit', async (req,res) => {
    const cafe = await Cafe.findById(req.params.id);
    res.render('cafes/edit', {cafe});
});

app.put('/cafes/:id', async (req,res) => {
    const {id} = req.params;
    const cafe = await Cafe.findByIdAndUpdate(id,{...req.body.cafe});
    res.redirect(`/cafes/${cafe._id}`);
});

app.delete('/cafes/:id', async (req,res) => {
    const {id} = req.params;
    await Cafe.findByIdAndDelete(id);
    res.redirect('/cafes');
});

app.listen(3000, ()=> {
    console.log('Serving on port 3000');
});