const jsonwebtoken   = require('jsonwebtoken');
const { JWT_SECRET } = require("../config/config");
const userModel      = require('../models/users');

/**
 * @description This function handles token generation for logged in users
 * @param {Object} payload containing the field object
 * @returns {token}  a signed token
 */

const token_middleware = (payload,duration = 86400) => {
    return jsonwebtoken.sign(payload,JWT_SECRET,{expiresIn:duration});
};

/**
 * @description This function handles token authentication 
 * @param {Object} req,res,next containing the field object,response and next function
 * @returns {boolean}  returns a boolean and hands over to the next function
 */

const user_auth_middleware  =  (req,res,next)=>{
    let token = req.body.token || req.query.token || req.headers["x-access-token"];

    if (!token) {
            res.status(400).send({
            status:  400,
            message: "Token is required,kindly login"
        });
        return false;
    }

    jsonwebtoken.verify(token, JWT_SECRET, (err,decoded)=>{
        if (err) {
            res.status(401).send({
                message: 'Invalid Token',
                status: 401
            });
            return false;
        }

        userModel.findOne({_id: decoded._id}).exec((err,payload)=>{
            if (err) {
                res.status(500).send({
                    message: "Error from middleware",
                    status:500
                });
                return false;
            }

            if(!payload) {
                    res.status(204).send({
                    status:  204,
                    message: "user not found"
                });
                return false;
            }
            req.user = payload;
            next();
        });
    });
};

module.exports = {token_middleware,user_auth_middleware}
