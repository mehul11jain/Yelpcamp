var express=require("express");
var app=express();
var bodyParser=require("body-parser");
var mongoose=require("mongoose");
require('dotenv').config();
var passport=require("passport");
var LocalStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var methodOverride=require("method-override");
var User=require("./models/user.js");
var flash=require("connect-flash");
mongoose.connect(process.env.DB_HOST,{useNewUrlParser:true,useCreateIndex:true}).then(()=>{
	console.log("Connected to db!");
}).catch(err=>{
	console.log(err.message);
});

var Campground=require("./models/campground.js");
var seedDB=require("./seeds.js");
var Comment=require("./models/comment.js");

var commentRoutes=require("./routes/comments.js");
var campgroundRoutes=require("./routes/campgrounds.js");
var authRoutes=require("./routes/auth.js");


app.use(methodOverride("_method"));
//seedDB(); //seed the database
app.use(flash());
//Passport configuration

app.use(require("express-session")({
    secret:"Rusty",
    resave:false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));

app.use(function(req,res,next){
   res.locals.currentUser=req.user;
   res.locals.error=req.flash("error");
   res.locals.success=req.flash("success");
   next();
});

app.use(authRoutes);
app.use(commentRoutes);
app.use(campgroundRoutes);

app.listen(process.env.PORT || 3000,function(){
    console.log("Server Started");
});