const express = require('express');
const { getBootcamps, getBootcamp, CreateBootcamp, UpdateBootcamp, DeleteBootcamp, getBootcampsInRadius, bootcampPhotoUplaod } = require('../controllers/bootcamps');
const Bootcamp = require('../models/Bootcamps');
const advancedResults = require('../middleware/advancedResults');

//Include other resource routers
const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

//Re-router into other resource router
router.use('/:bootcampId/courses', courseRouter);
router.use('/:bootcampId/reviews', reviewRouter);

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);
router.route('/').get(advancedResults(Bootcamp, 'courses'), getBootcamps).post(protect, authorize('publisher', 'admin'), CreateBootcamp);
router.route('/:id').get(getBootcamp).put(protect, authorize('publisher', 'admin'), UpdateBootcamp).delete(protect, authorize('publisher', 'admin'), DeleteBootcamp);
router.route('/:id/photo').put(protect, authorize('publisher', 'admin'), bootcampPhotoUplaod);

module.exports = router;