"use strict";

//Import required modules
let express        =   require("express");
let parser         =   require("body-parser");
let cors           =   require("cors");
let mongoose       =   require("mongoose");
let config         =   require("./config/config");
let port           =   process.env.PORT || 3000;
let app            =   express();
let endpoints      =   require("./endpoints/index")(express);


mongoose.Promise = global.Promise;

app.listen(port,(err)=>{
    if(err) {
        return err;
    }
    
});

app.use(cors());
app.use(parser.json());
app.use(parser.urlencoded({extended: false}));
app.use('/api/v1',endpoints);
mongoose.connect(config.prodDb,
{useUnifiedTopology:true,useNewUrlParser:true},
(err)=>{
    if (err) {
        return err;
    }
});


app.use((req,res,next)=>{
   return res.status(500).send({
        status:500,
        message: "Server error"
    });
});
