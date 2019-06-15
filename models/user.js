var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");


var userSchema=new mongoose.Schema({
    username:{type:String, unique:true},
    password:String,
	Avatar:String,
	firstName:String,
	lastName:String,
	Email:String,
	Description:String,
	resetPasswordToken: String,
    resetPasswordExpires: Date,
	isAdmin:{type:Boolean,default:false}
});
userSchema.plugin(passportLocalMongoose);
userSchema.methods.validPassword = function( pwd ){
	console.log(pwd);
	console.log(this);
    return ( this.password == pwd );
};

module.exports=mongoose.model("User",userSchema);