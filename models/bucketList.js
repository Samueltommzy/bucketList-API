"use strict"

let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
let autoIncrement = require('mongoose-auto-increment');
let config   = require('../config/config');

autoIncrement.initialize(mongoose.createConnection(config.prodDb));

let itemSchema = new Schema({
    name:{type: String,required:true},
    date_created:{type:Date,default:Date.now},
    date_modified:{type:Date},
    done:{type:String,default:"false"}
});

let bucketListSchema = new Schema({
    name:{type:String,required:true,unique:true},
    items:[itemSchema],
    date_created: {type:Date,default:Date.now},
    date_modified:{type:Date},
    created_by:{type:Number,ref: 'User'}
});

bucketListSchema.plugin(autoIncrement.plugin,{model:'itemSchema',field:'_id',startAt:1,incrementBy:1});
itemSchema.plugin(autoIncrement.plugin,{model:'BucketList',field:'_id',startAt:1,incrementBy:1});

let bucketModel = mongoose.model('BucketList',bucketListSchema);
let itemModel = mongoose.model('itemSchema',itemSchema);
module.exports = {
    bucketModel: bucketModel,
    itemModel: itemModel
};