"use strict"
let userModel =  require('../models/users');
let bucketList =  require('../models/bucketList');
let {token_middleware,user_auth_middleware} = require('../middleware/middleware');
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
        let created_by = req.user.id;
        let name = req.body.name;
        let bucketObj = {created_by,name}
        let newBuck = bucketList(bucketObj);
        newBuck.save((err,data)=>{
            if(err){
                res.status(500).send({
                    status:500,
                    message:"An error ocurred"
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
    //List all bucketLists created
    bucket_list.get('/bucketlists',user_auth_middleware,(req,res)=>{
        bucketList.find().exec((err,data)=>{
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
        bucketList.findOne({id:bucketId}).exec((err,data)=>{
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
    //Delete a bucket list

    //create a new item in a bucket list
    bucket_list.post('/bucketlists/:id/items',user_auth_middleware,(req,res)=>{
        let item = req.body;
        let bucketId = req.params.id;
        bucketList.findOne({id:bucketId}).exec((err,data)=>{
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

    })

    return bucket_list;
}