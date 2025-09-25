const express = require('express');
const router = express.Router({mergeParams: true});
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const {reviewSchema} = require('../schemas.js');
const Cafe = require('../models/cafe');
const Review = require('../models/review');

const validateReview = (req,res,next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

router.post('/', validateReview, catchAsync(async (req,res) => {
    const cafe = await Cafe.findById(req.params.id);
    const review = new Review(req.body.review);
    cafe.reviews.push(review);
    await review.save();
    await cafe.save();
    req.flash('success', 'Created new review!')
    res.redirect(`/cafes/${cafe._id}`);
}));

router.delete('/:reviewId', catchAsync(async (req,res) => {
    const {id,reviewId} = req.params;
    await Cafe.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Review deleted.');
    res.redirect(`/cafes/${id}`);
}));

module.exports = router;