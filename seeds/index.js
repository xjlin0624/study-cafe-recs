const mongoose = require('mongoose');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers');
const Cafe = require('../models/cafe')

mongoose.connect('mongodb://localhost:27017/yelp-cafe');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async() => {
    await Cafe.deleteMany({});
    for(let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random()*20) + 10;
        const cafe = new Cafe({
            author: '68d63f0ed6f79952bbf4c2ae',
            title: `${sample(descriptors)} ${sample(places)}`,
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            image: `https://picsum.photos/400?random=${Math.random()}`,
            description: 'this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description this is a placeholder description',
            price
        });
        await cafe.save();
    };
};

seedDB().then(() => {
    mongoose.connection.close()
});