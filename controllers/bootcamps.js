const path = require('path')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamps');
//Controllers


//@desc  Get all bootcamps
//@route GET /api/v1/bootcamps
//@access Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    let query;
    //Copy req.query
    const reqQuery = { ...req.query };
    //Field to excute  
    const removeFields = ['select', 'sort', 'page', 'limit'];
    //Loop over removefield and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    //Create query string
    let queryStr = JSON.stringify(reqQuery);
    //Create operators ($gt,$gte,$lt,$lte,$in)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    //Finding resource
    query = Bootcamp.find(JSON.parse(queryStr)).populate('courses');
    //Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }
    //Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt')
    }
    //Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Bootcamp.countDocuments();

    query = query.skip(startIndex).limit(limit);


    //Exceuting query
    const bootcamp = await query;
    //Pagination result

    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }
    res.status(200).json({
        success: true,
        count: bootcamp.length,
        pagination,
        data: bootcamp
    });

});

//@desc  Get single bootcamps
//@route GET /api/v1/bootcamps/:id
//@access Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        data: bootcamp
    });
    // res.status(400).json({ success: false });
    next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
});

//@desc  Create new bootcamp
//@route POST /api/v1/bootcamps
//@access private
exports.CreateBootcamp = asyncHandler(async (req, res, next) => {
    //Add user to body
    req.body.user = req.user.id;

    //Check for published bootcamp 
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });
    //If the user is not an admin , they can only add one bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The user with Id ${req.user.id} has already published a bootcamp`, 400));
    }

    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json({
        success: true,
        data: bootcamp
    });
});

//@desc  Update bootcamp
//@route PUT /api/v1/bootcamps/:id
//@access private
exports.UpdateBootcamp = asyncHandler(async (req, res, next) => {

    let bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }
    //Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== ' admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`, 401));
    }
    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(201).json({
        success: true,
        data: bootcamp
    });
});

//@desc  Delete bootcamp
//@route DELETE /api/v1/bootcamps/:id
//@access private
exports.DeleteBootcamp = asyncHandler(async (req, res, next) => {

    let bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }
    //Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== ' admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to  this bootcamp`, 401));
    }
    bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        data: {}
    });
});


//@desc  Get bootcamp within a radius
//@route GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params;
    //Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    //Calc radius using radius 
    //Divide dist by radius of earth
    //Earth radius = 3,963mi / 6,378 km
    const radius = distance / 3963.2;

    const bootcamps = await Bootcamp.find({
        location:
        {
            $geoWithin:
                { $centerSphere: [[lng, lat], radius] }
        }
    })
    res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
});

//@desc  Upload photo for bootcamp
//@route PUT /api/v1/bootcamps/:id/photo
//@access private
exports.bootcampPhotoUplaod = asyncHandler(async (req, res, next) => {

    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }
    //Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== ' admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to upload this bootcamp`, 401));
    }

    if (!req.files) {
        return next(new ErrorResponse('Please upload a file', 400));
    }


    const file = req.files.file;
    //Make sure the image is photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse('Please upload a image file', 400));
    }
    //Check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload a image size less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    //Ctreate custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.log(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    })
    res.status(200).json({
        success: true,
        data: file.name
    });
});