const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const {cafeSchema} = require('../schemas.js');
const Cafe = require('../models/cafe');
const {isLoggedIn} = require('../middleware');

const validateCafe = (req,res,next) => {
    const {error} = cafeSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

router.get('/', catchAsync(async (req,res) => {
    const cafes = await Cafe.find({});
    res.render('cafes/index', {cafes});
}));

router.get('/new', isLoggedIn, (req,res) => {
    res.render('cafes/new');
});

router.post('/', isLoggedIn, validateCafe, catchAsync(async (req,res,next) => {
    const cafe = new Cafe(req.body.cafe);
    await cafe.save();
    req.flash('success', 'Successfully made a new cafe!');
    res.redirect(`/cafes/${cafe._id}`);
}));

router.get('/:id', catchAsync(async (req,res,) => {
    const cafe = await Cafe.findById(req.params.id).populate('reviews');
    if (!cafe) {
        req.flash('error', 'Cannot find cafe.');
        return res.redirect('/cafes');
    }
    res.render('cafes/show', {cafe});
}));

router.get('/:id/edit', isLoggedIn, catchAsync(async (req,res) => {
    const cafe = await Cafe.findById(req.params.id);
    if (!cafe) {
        req.flash('error', 'Cannot find cafe.');
        return res.redirect('/cafes');
    }
    res.render('cafes/edit', {cafe});
}));

router.put('/:id', isLoggedIn, validateCafe, catchAsync(async (req,res) => {
    const {id} = req.params;
    const cafe = await Cafe.findByIdAndUpdate(id,{...req.body.cafe});
    req.flash('success', 'Successfully updated cafe!')
    res.redirect(`/cafes/${cafe._id}`);
}));

router.delete('/:id', isLoggedIn, catchAsync(async (req,res) => {
    const {id} = req.params;
    await Cafe.findByIdAndDelete(id);
    req.flash('success', 'Cafe deleted.');
    res.redirect('/cafes');
}));

module.exports = router;