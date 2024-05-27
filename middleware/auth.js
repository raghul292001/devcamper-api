const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const errorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

//Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        //set token from bearer token in header
        token = req.headers.authorization.split(' ')[1];
        //set token from cookie
    }
    // else if (req.cookie.token) {
    //  token = req.cookie.token;
    //}
    //Make sure token exist
    if (!token) {
        return next(new errorResponse('Not authorize to access this route', 401));
    }
    try {
        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        req.user = await User.findById(decoded.id);
        next();

    } catch (err) {
        return next(new errorResponse('Not authorize to access this route', 401));
    }
});

//Grant access to specific role

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`User role ${req.user.role} is not authorizes to access this route`, 403));
        }
        next();
    }
}