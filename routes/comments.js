var express=require("express");
var router=express.Router();
var Campground=require("../models/campground.js");
var Comment=require("../models/comment.js");
var middleware=require("../middleware");
var moment=require('moment');


router.get("/campgrounds/:id/comments/new",middleware.isLoggedIn,function(req, res) {
        Campground.findById(req.params.id,function(err,campground){
           if(err)
           console.log(err);
           else{
            res.render("comments/new",{campground:campground});     
           }
        });
});
router.post("/campgrounds/:id/comments",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err, campground){
        if(err)
        console.log(err);
        else{
            Comment.create({text:req.body.text, date:moment().format('MMMM Do, YYYY')},function(err,comment){
                if(err)
                    console.log(err);
                else{
                    comment.author.id=req.user._id;
                    comment.author.username=req.user.username;
                    comment.save();
                    console.log(comment);
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success","Successfully added Comment!");
                    res.redirect("/campgrounds/"+campground._id);
                    }
            });

        }
    });
}); 

//COMMENT EDIT ROUTE
router.get("/campgrounds/:id/comments/:comments_id/edit",middleware.checkCommentOwnership,function(req,res){
    Comment.findById(req.params.comments_id,function(err, foundComment){
        if(err)
        res.redirect("back");
        else
        {
        res.render("comments/edit",{campground:req.params.id,comment:foundComment}); 
        }
    });
   
});

//COMMENT UPDATE

router.put("/campgrounds/:id/comments/:comments_id",middleware.checkCommentOwnership,function(req,res){
        console.log(req.body.text);
      Comment.findByIdAndUpdate(req.params.comments_id,req.body.comment,function(err){
          if(err)
          {
          req.flash("error",err.message);    
          res.redirect("back");
          }
          else
          {
            console.log("updated");  
            res.redirect("/campgrounds/"+req.params.id);    
          }
      }); 
});



//COMMENT DESTROY ROUTE
router.delete("/campgrounds/:id/comments/:comments_id",function(req,res){
    console.log("Hello");
   Comment.findByIdAndRemove(req.params.comments_id,function(err){
      if(err)
       res.redirect("back");
       else
       {
       req.flash("Success","Comment Deleted.");       
       res.redirect("/campgrounds/"+req.params.id);    
       }
   }); 
});

 module.exports=router;