const express = require('express');
const router = express.Router({mergeParams: true});
const {validateReview, isLoggedIn, isReviewAuthor} = require('../middleware');
const Cafe = require('../models/cafe');
const Review = require('../models/review');
const catchAsync = require('../utils/catchAsync');

router.post('/', isLoggedIn, validateReview, catchAsync(async (req,res) => {
    const cafe = await Cafe.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    cafe.reviews.push(review);
    await review.save();
    await cafe.save();
    req.flash('success', 'Created new review!')
    res.redirect(`/cafes/${cafe._id}`);
}));

router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(async (req,res) => {
    const {id,reviewId} = req.params;
    await Cafe.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Review deleted.');
    res.redirect(`/cafes/${id}`);
}));

module.exports = router;