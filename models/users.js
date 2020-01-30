"use strict"

let mongoose = require('mongoose');
let bcrypt   = require('bcrypt-node');
let Schema   = mongoose.Schema;
let autoIncrement = require('mongoose-auto-increment');
let config   = require('../config/config');

autoIncrement.initialize(mongoose.createConnection(config.prodDb));




let userSchema = new Schema({
    email: {type: String,required: true,unique:true},
    password: {type: String,required:true}
});

//Hash password before storing in database
userSchema.pre("save",function(next){
    let user = this;
    if(!user.isModified("password")) return next();
    bcrypt.hash(user.password,null,null,function(err,hash){
        if(err) return next(err);
        user.password = hash;
        next();
    });
});

userSchema.methods.passwordCheck = function(password, callback) {
    let user = this;
    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return callback(err);
        callback(null, isMatch);
    });
};

userSchema.plugin(autoIncrement.plugin,{model:'userSchema',field:'_id',startAt:101,incrementBy:1});
module.exports = mongoose.model('User',userSchema);