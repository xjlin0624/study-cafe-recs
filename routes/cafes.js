const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Cafe = require('../models/cafe');
const {isLoggedIn, isAuthor, validateCafe} = require('../middleware');

router.get('/', catchAsync(async (req,res) => {
    const cafes = await Cafe.find({});
    res.render('cafes/index', {cafes});
}));

router.get('/new', isLoggedIn, (req,res) => {
    res.render('cafes/new');
});

router.post('/', isLoggedIn, validateCafe, catchAsync(async (req,res,next) => {
    const cafe = new Cafe(req.body.cafe);
    cafe.author = req.user._id;
    await cafe.save();
    req.flash('success', 'Successfully made a new cafe!');
    res.redirect(`/cafes/${cafe._id}`);
}));

router.get('/:id', catchAsync(async (req,res,) => {
    const cafe = await Cafe.findById(req.params.id).populate({
        path:'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    // console.log(cafe);
    if (!cafe) {
        req.flash('error', 'Cannot find cafe.');
        return res.redirect('/cafes');
    }
    res.render('cafes/show', {cafe});
}));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req,res) => {
    const {id} = req.params;
    const cafe = await Cafe.findById(id);
    if (!cafe) {
        req.flash('error', 'Cannot find cafe.');
        return res.redirect('/cafes');
    }
    res.render('cafes/edit', {cafe});
}));

router.put('/:id', isLoggedIn, isAuthor, validateCafe, catchAsync(async (req,res) => {
    const {id} = req.params;
    const cafe = await Cafe.findByIdAndUpdate(id,{...req.body.cafe});
    req.flash('success', 'Successfully updated cafe!')
    res.redirect(`/cafes/${cafe._id}`);
}));

router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req,res) => {
    const {id} = req.params;
    await Cafe.findByIdAndDelete(id);
    req.flash('success', 'Cafe deleted.');
    res.redirect('/cafes');
}));

module.exports = router;