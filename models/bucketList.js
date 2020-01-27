"use strict"

let mongoose = require('mongoose');
let Schema   = mongoose.Schema;
let autoIncrement = require('mongoose-auto-increment');

autoIncrement.initialize(mongoose.createConnection('mongodb://127.0.0.1:27017/BucketList'))

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

bucketListSchema.plugin(autoIncrement.plugin,{model:'itemSchema',field:'id',startAt:1,incrementBy:1});
itemSchema.plugin(autoIncrement.plugin,{model:'BucketList',field:'id',startAt:1,incrementBy:1});

module.exports = mongoose.model('BucketList',bucketListSchema);