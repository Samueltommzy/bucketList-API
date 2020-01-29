"use strict"
let userModel =  require('../models/users');
let {bucketModel} =  require('../models/bucketList');
let {token_middleware,user_auth_middleware} = require('../middleware/middleware');
let {del} = require('../controllers/controllers')

module.exports = (express)=>{
    let bucket_list = express.Router();

    bucket_list.post('auth/createuser',(req,res)=>{
        let {email,password} =req.body;
        let userObj = {email,password};
        let newUser = userModel(userObj);
        newUser.save((err,data)=>{
            if(err){
                if (err.code == 11000) {
                    let error = err['errmsg'].split(':')[2].split(' ')[1].split('_')[0];
                    res.status(500).send({
                        message: `${error} has been taken`,
                        status: 11000,
                        error: err
                    });
                    return false;
                }
                res.status(500).send({
                    status:500,
                    message:"Could not create user"
                })
            }
            else{
                data['password'] = undefined;
                res.status(200).send({
                    status:200,
                    message: "user created successfully",
                    data:data
                });
            }
        });
    });
    
    //User login endpoint
    bucket_list.post('/auth/login',(req,res)=>{
        let { email,password} = req.body;
       userModel.findOne({email:email}).exec((err,data)=>{
           if (err) return next(err);
           if(!data) {
               res.status(400).send({
                   status: 400,
                   message: "Invalid credentials"
               });
               return false;
           }
           data.passwordCheck(password,(err,isMatch)=>{
               if (err) return next(err);
               if(!isMatch) {
                   res.status(400).send({
                       status:  400,
                       message: "Invalid credentials"
                   });
                   return false;
               }
            else{
               let tokenObj = {
                   _id:   data._id,
                   email: data.email
               };
               let token = token_middleware(tokenObj);
               res.status(200).send({
                   status:  200,
                   message: "login successful",
                   token:   token
               });
           }
           });
       });
    });

    //create a new bucketlist
    bucket_list.post('/bucketlists',user_auth_middleware,(req,res)=>{
        let created_by = req.user._id;
        let name = req.body.name;
        let bucketObj = {created_by,name};
        let newBuck = bucketModel(bucketObj);
        newBuck.save((err,data)=>{
            if(err){
                res.status(500).send({
                    status:500,
                    message:"An error ocurred here"
                });
            return false;
            }
            res.status(200).send({
                status:200,
                message: "Successfully created bucketList",
                data: data
            });
        });
    });

    //List all bucketLists created by a user (paginated response)
    bucket_list.get('/bucketlists',user_auth_middleware,(req,res)=>{
        let page  = parseInt(req.query.page) ||1;
        let limit = (parseInt(req.query.limit) > 100?100:parseInt(req.query.limit)) ||20;
        let search= req.query.q;
        let userId = req.user._id;
        let query = {};
        query.skip = limit * (page-1);
        query.limit = limit;
        let filterCriteria = {userId};
        if (search) filterCriteria = {...filterCriteria,name:search}
       bucketModel.find(filterCriteria,query).exec((err,data)=>{
            if (err) {
                res.status(500).send({
                    status:500,
                    message: "An error ocurred"
                });
                return false;
            }
            res.status(200).send({
                status:200,
                message:"Bucket lists loaded successfully",
                data:data

            });
        });
    });

    //Get a single bucket list
    bucket_list.get('/bucketlists/:id',user_auth_middleware,(req,res)=>{
        let bucketId = req.params.id;
        let userId = req.user._id;
       bucketModel.findOne({created_by:userId,_id:bucketId}).exec((err,data)=>{
            if(err){
                res.status(500).send({
                    status:500,
                    message:"An error ocurred"    
                });
                return false;
            }
            res.status(200).send({
                status:200,
                message:"Bucket list loaded successfully",
                data:data
            });
        });
    });

    //Update a bucket list
    bucket_list.put('/bucketlists/:id',user_auth_middleware,(req,res)=>{
        let bucketId = req.params.id;
        let update = req.body;
        let userId = req.user._id;
        update['date_modified'] = new Date();
        bucketModel.findOneAndUpdate({created_by:userId,_id:bucketId},{$set:update},{new:true,upsert:true}).exec((err,data)=>{
            if (err) {
                res.status(500).send({
                    status:500,
                    message:"An error ocurred"
                });
                return false;
            }
            res.status(200).send({
                status:200,
                message:'Bucket list updated',
                data:data
            });
        });
    });

    //Delete a bucket list
    bucket_list.delete('/bucketlists/:id',user_auth_middleware,(req,res)=>{
        let bucketId = req.params.id;
        let userId = req.user._id;
        bucketModel.remove({created_by:userId,_id:bucketId}).exec((err,data)=>{
            if (err) {
                res.status(500).send({
                    status:500,
                    message:"An error ocurred"
                });
                return false;
            }
            res.status(200).send({
                status:200,
                message: `Bucket list ${bucketId} deleted`
            });
        });
    });

    //create a new item in a bucket list
    bucket_list.post('/bucketlists/:id/items',user_auth_middleware,(req,res)=>{
        let item = req.body;
        let bucketId = req.params.id;
        let userId = req.user._id;
        bucketModel.findOne({created_by:userId,_id:bucketId}).exec((err,data)=>{
            if(err){
                res.status(500).send({
                    status:500,
                    message:"Could not find bucket list"
                });
                return false;
            }
            data.items.push(item);
            data.save((err,data)=>{
                if(err) {
                    res.status(500).send({
                        status:500,
                        message:"Unable to create item"
                    });
                    return false;
                }
                res.status(200).send({
                    status:200,
                    message:"Successfully added item",
                    data:data
                });
            });
        });
    });

    //list all items in a bucket list
    bucket_list.get('/bucketlists/:id/items',user_auth_middleware,(req,res)=>{
        let bucketId = req.params.id;
        let userId = req.user._id
        bucketModel.findOne({created_by:userId,_id:bucketId}).exec((err,data)=>{
            if (err) {
                res.status(500).send({
                    status:500,
                    message: "An error ocurred"
                });
                return false;
            }
            res.status(200).send({
                status:200,
                message:"All items in bucket list loaded",
                data:data['items']
            });
        })
    })
    
    //Get a single item in a bucket list
    bucket_list.get('/bucketlists/:bid/items/:id',user_auth_middleware,(req,res)=>{
        let bucketId = req.params.bid;
        let itemId   = req.params.id;
        let userId = req.user._id
        bucketModel.findOne({created_by:userId,_id:bucketId}).exec((err,data)=>{
            if (err) {
                res.status(500).send({
                    status:500,
                    message: "An error ocurred"
                });
                return false;
            }
            
            let item = data.items.id(itemId);
            res.status(200).send({
                status:200,
                message:"Loaded item successsfully",
                data:item
            });
        });
    });

    //Update a single item in a bucket list
    bucket_list.put('/bucketlists/:bid/items/:id', user_auth_middleware,(req,res)=>{
        let bucketId = req.params.bid;
        let itemId = req.params.id;
        let userId = req.user._id
        let updateObj = req.body;
        updateObj['date_modified'] =new Date();
        bucketModel.findOne({created_by:userId,_id:bucketId}).exec((err,data)=>{
            if (err){
                res.status(500).send({
                    status:500,
                    message: "An error ocurred",
                    error: err
                });
                return false;
            }
            let item = data.items.id(itemId);
            item.set(updateObj);
            data.markModified();
            data.save((err,data)=>{
                if (err) {
                    res.status(500).send({
                        status:500,
                        message: "An error ocurred",
                        error:err
                    });
                    return false;
                }
                res.status(200).send({
                    status:200,
                    message:`Item ${itemId} updated`,
                    data: data
                });
            });
        });
    });

    //delete a single item in a bucket list
    bucket_list.delete('/bucketlists/:bid/items/:id',user_auth_middleware,(req,res)=>{
        let bucketId = req.params.bid;
        let itemId   = req.params.id;
        let userId = req.user._id
        bucketModel.update(
            {"_id":bucketId,"created_by":userId},
            {"$pull": {"items":{"_id":itemId}}}
        ).exec((err,data)=>{
            if (err) {
                res.status(500).send({
                    status:500,
                    message: "An error ocurred"
                });
                return false;
            }
            res.status(200).send({
                status: 200,
                message: `item ${itemId} has been removed`,
            });
        });
    });

    return bucket_list;
}