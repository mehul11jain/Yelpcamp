var Campground=require("../models/campground.js");
var Comment=require("../models/comment.js");
//ALL the middleware

var middlewareObj={};
middlewareObj.checkCampgroundOwnership=function(req,res,next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id,function(err,foundCampground){
            if(err)
                {
                req.flash("error","Comment not found");    
                res.redirect("back");
                    
                }
            else{
                    
                    if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin)
                        {
                        return next();  
                        }
                    else{
                        res.flash("error","You don't have permission to do that!!");
                        res.redirect("back");
                        }
                }
        });
     }
     else
     {
     res.flash("error","You Must Login First!!");       
     res.redirect("/login");
     }
};

middlewareObj.checkCommentOwnership=function(req,res,next){
    console.log(req.isAuthenticated());
    if(req.isAuthenticated()){
        console.log(req.params.comments_id);
        Comment.findById(req.params.comments_id,function(err,foundComment){
            if(err)
                {
                res.flash("error","Campground Cannot be Displayed!");   
                res.redirect("back");
                    
                }
            else{
                    console.log(foundComment);
                    if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin)
                        {
                        return next();  
                        }
                    else{
                        res.flash("error","You dont have the permission to do that!!");
                        res.redirect("back");
                        }
                }
        });
     }
     else
     {
     res.flash("error","You must Login First!");  
     res.redirect("/login");
     }
};

middlewareObj.isLoggedIn=function(req,res,next){
     console.log(req.isAuthenticated());
     if(req.isAuthenticated()){
         return next(); //middleware Problem
     }
     else
     {
        req.flash("error","Please Login First!"); 
        res.redirect("/login");
     }
 };

module.exports=middlewareObj;