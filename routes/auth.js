var express=require("express");
var router=express.Router();
var passport=require("passport");
var User=require("../models/user.js");
var Campground=require("../models/campground.js");
var Notification = require("../models/notification.js");
require('dotenv').config();
var async=require("async");
var nodemailer=require("nodemailer");
var crypto=require("crypto");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_ENV, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
});

router.get("/",function(req,res){
    res.render("landing");
});

//Authentication Routes
router.get("/register",function(req, res) {
   res.render("register"); 
});

router.post("/register",upload.single('Avatar'),function(req,res){
	cloudinary.uploader.upload(req.file.path, function(result) {
  // add cloudinary url for the image to the campground object under image property
  	req.body.Avatar = result.secure_url;
	  var newUser=new User({
		  	  username:req.body.username,
				  firstName:req.body.firstName,
		  		lastName:req.body.lastName,
		  		Email:req.body.Email,
		  		Avatar:req.body.Avatar,
		  		Description: req.body.Description
				});
	  if(req.body.adminCode === process.env.SECRET_CODE){
		  newUser.isAdmin=true;
	  }
      User.register(newUser,req.body.password,function(err,user){
         if(err)
         {
		 req.flash("error",err.message);	 	
         res.redirect("/register");
         }
         passport.authenticate("local")(req,res,function(){
             req.flash("success","Welcome to YelpCamp "+req.body.username);
            res.redirect("/campgrounds");  
         });
      });
	});  
});

//Login Routes
router.get("/login",(req,res)=>{
  res.render("login");  
});

router.post("/login",passport.authenticate("local",{
   successRedirect:"/campgrounds",
   failureRedirect:"/login",
   failureFlash : true,
   successFlash : 'Successful Login',	
}),(req,res)=>{
});

//Logout Route

router.get("/logout",(req,res)=>{
    req.logout();
    req.flash("success","Successfully Logged out!");
    res.redirect("/campgrounds");
});

//user Profile Route
router.get("/user/:id",async (req,res)=>{
	let user;
	  try {
    	 user= await User.findById(req.params.id).populate('followers').exec();
  		}catch(err){
    	req.flash('error', err.message);
    	return res.redirect('back');
  		}
	
	User.findById(req.params.id,function(err,foundUser){
		if(err || !foundUser){
			req.flash("error","User not found!!");
			res.redirect("/campgrounds");
		}
		else{
			Campground.find().where('author.id').equals(foundUser._id).exec(function(err,campgrounds){
				if(err){
			req.flash("error","User not found!!");
			res.redirect("/campgrounds");
					}
				else{
        console.log(foundUser);  
				res.render("users/show",{foundUser:foundUser,campgrounds:campgrounds,user:user});		
				}	
			});
			
		}
	});
});


// follow user
router.get('/follow/:id', isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.params.id);
    let cnt=0;
    for(var i=0;i<user.followers.length;i++){
      console.log("user :"+user.followers[i]);
      console.log("req :"+req.user._id);
      console.log(String(user.followers[i]) !== String(req.user._id));
      if(String(user.followers[i]) !== String(req.user._id)){
        cnt++;
      }
  }
    console.log("cnt :"+cnt);
    console.log("user :"+user.followers.length);
    if(cnt == user.followers.length){
    user.followers.push(req.user._id);
    user.save();
    req.flash('success', 'Successfully followed ' + user.username + '!');
    res.redirect('/user/' + req.params.id);
    }
    else{
      req.flash('error', 'Already Followed');
      res.redirect('back');
    }
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// view all notifications
router.get('/notifications', isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notifications',
      options: { sort: { "_id": -1 } }
    }).exec();
    let allNotifications = user.notifications;
    res.render('notification/index', {allNotifications});
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});

// handle notification
router.get('/notifications/:id', isLoggedIn, async function(req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect(`/campgrounds/${notification.campgroundId}`);
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});


//reset route
router.get('/forgot',function(req,res){
	res.render("forgot"); 
});


router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ Email: req.body.email }, function(err, user) {
        if (!user) {
	      console.log(req.body.email);	
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.GMAIL_ID,
          pass: process.env.GMAIL_PW
        }
      });
		console.log(user.Email);
      var mailOptions = {
        to: user.Email,
        from: process.env.GMAIL_ID,
        subject: 'YelpCamp Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.Email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: process.env.GMAIL_ID,
          pass: process.env.GMAIL_PW
        }
      });
      var mailOptions = {
        to: user.Email,
        from: process.env.GMAIL_ID,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.Email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});


function isLoggedIn(req,res,next){
     console.log(req.isAuthenticated());
     if(req.isAuthenticated()){
         return next(); //middleware Problem
     }
     else
     {
   res.redirect("/login");
     }
 }
 module.exports=router;