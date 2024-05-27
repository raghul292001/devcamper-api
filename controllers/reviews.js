const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Review = require('../models/Review');
const Bootcamp = require('../models/Bootcamps');

//@desc  Get Review
//@route GET /api/v1/reviews
//@route GET /api/v1/bootcamps/:bootcampId/reviews
//@access Public

exports.getReviews = asyncHandler(async (req, res, next) => {
    let query;
    if (req.params.bootcampId) {
        query = Review.find({ bootcamp: req.params.bootcampId });
    } else {
        query = Review.find().populate({
            path: 'bootcamp',
            select: 'name description'
        });
    }

    const reviews = await query;

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });
});

//@desc  Get Single review
//@route GET /api/v1/review
//@route GET /api/v1/reviews/:id
//@access Public

exports.getReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    });
    if (!review) {
        return next(new ErrorResponse(`No review found with the id ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: review
    })

});

//@desc  Add review
//@route POST /api/v1/review
//@route POST /api/v1/bootcamps/:bootcampId/reviews
//@access Private

exports.addReview = asyncHandler(async (req, res, next) => {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;
    const bootcamp = await Bootcamp.findById(req.params.BootcampId);
    if (!bootcamp) {
        return next(new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`, 404));
    }

    const review = await Review.create(req.body);

    res.status(201).json({
        success: true,
        data: review
    })

});

//@desc  Update review
//@route PUT /api/v1/reviews/:reviewId
//@access Private

exports.updateReview = asyncHandler(async (req, res, next) => {
    let review = await Review.findById(req.params.id);
    if (!review) {
        return next(new ErrorResponse(`No review with the id of ${req.params.bootcampId}`, 404));
    }
    //Make sure review belong to the user or user is an admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorize to update review`, 401));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json({
        success: true,
        data: review
    })

});
//@desc  Delete review
//@route DELETE /api/v1/reviews/:reviewId
//@access Private

exports.deleteReview = asyncHandler(async (req, res, next) => {
    let review = await Review.findById(req.params.id);
    if (!review) {
        return next(new ErrorResponse(`No review with the id of ${req.params.bootcampId}`, 404));
    }
    //Make sure review belong to the user or user is an admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorize to update review`, 401));
    }

    await review.remove();

    res.status(200).json({
        success: true,
        data: {}
    })

});