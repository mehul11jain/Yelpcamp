var express=require("express");
var router=express.Router();
var Campground=require("../models/campground.js");
var Comment=require("../models/comment.js");
var User=require("../models/user.js");
var Notification=require("../models/notification.js");
var middleware=require("../middleware");
var multer = require('multer');
require('dotenv').config();
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

router.get("/campgrounds",function(req,res){
		  if(req.query.q){
			  const regex = new RegExp(escapeRegex(req.query.q), 'gi');
			 Campground.find({name:regex},function(err,cmp){
              if(err)
              console.log(err);
              else{
                res.render("campgrounds/index",{campgrounds:cmp});      
                  }
          }); 
		  }
	else{
          Campground.find({},function(err,cmp){
              if(err)
              console.log(err);
              else{
                res.render("campgrounds/index",{campgrounds:cmp});      
                  }
			  
          });
	}
});

router.get("/campgrounds/new",middleware.isLoggedIn,function(req,res){
     res.render("campgrounds/new"); 
});

router.post("/campgrounds",upload.single('image'),async function(req,res){
   cloudinary.uploader.upload(req.file.path, async function(result) {
  // add cloudinary url for the image to the campground object under image property
  req.body.campground.image = result.secure_url;
	   
  req.body.campground.imageId = result.public_id;	   
  // add author to campground
  req.body.campground.author = {
    id: req.user._id,
    username: req.user.username
  };
    try {
      let campground = await Campground.create(req.body.campground);
      let user = await User.findById(req.user._id).populate('followers').exec();
      let newNotification = {
        username: req.user.username,
        campgroundId: campground.id
      };
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        follower.notifications.push(notification);
        follower.save();
      }

      //redirect back to campgrounds page
      res.redirect(`/campgrounds/${campground.id}`);
    } catch(err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
});
});              


router.get("/campgrounds/:id",function(req, res) {
   //find the campground with given ID
   Campground.findById(req.params.id).populate("comments").exec(function(err,findcmp){
       if(err || !findcmp){
           req.flash("error","Campground not found");
           res.redirect("/campgrounds");
       }
       else{
             res.render("campgrounds/show",{campground:findcmp});
       }
   });
});

//EDIT campground route
router.get("/campgrounds/:id/edit",middleware.checkCampgroundOwnership,function(req, res){
    Campground.findById(req.params.id,function(err,foundCampground){
            if(err || !foundCampground)
                res.redirect("back");
            else
                {
				 console.log(foundCampground);	
                 res.render("campgrounds/edit",{campground:foundCampground});   
                }
    });
});    

//UPDATE campground route
router.put("/campgrounds/:id/edit",middleware.checkCampgroundOwnership,upload.single('image'), function(req,res){
	
    Campground.findById(req.params.id,async function(err,updated){
        if(err){
			req.flash("error",err.message);
			res.redirect("back");
		}
        else{
			if(req.file){
				try{
					await cloudinary.v2.uploader.destroy(updated.imageId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);	
					updated.imageId = result.public_id;
					updated.image = result.secure_url;
					}
				catch(err){
					 req.flash("error", err.message);
            		 res.redirect("back");
						  }
					}
			if(req.body.name){
				updated.name=req.body.name;
			}
			if(req.body.description){
				updated.description=req.body.description;
			}
			updated.save();
			req.flash("success","Successfully updated!!");
            res.redirect("/campgrounds/"+req.params.id);
        }
    });
});


//Destroy Campground Route
router.delete("/campgorunds/:id",middleware.checkCampgroundOwnership,function(req,res){
        Campground.findById(req.params.id,function(err,campground){
            if(err){
				req.flash("error",err.message);
				res.redirect("back");
			}
            else{
                    campground.comments.forEach(function(cmt){
                    console.log(cmt.id);
                    Comment.findByIdAndRemove(cmt._id,function(){
                        console.log(campground.comments);
                    });
                	});
                    Campground.findById(req.params.id,async function(err,campground){
						if(err){
							req.flash("error",err.message);
							res.redirect("back");
						}
						try {
                  			await cloudinary.v2.uploader.destroy(campground.imageId);
							campground.remove();
							req.flash("success","Successfully Deleted!!");
							res.redirect("/campgrounds");
						}
						catch(err){
							req.flash("error",err.message);
							res.redirect("back");
						}
                    });                                    
                }
        });
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}



 module.exports=router;