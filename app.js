const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
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

app.get('/', (req,res) => {
    res.render('home')
})

app.get('/cafes', async (req,res) => {
    const cafes = await Cafe.find({});
    res.render('cafes/index', { cafes })
})

app.listen(3000, ()=> {
    console.log('Serving on port 3000')
})