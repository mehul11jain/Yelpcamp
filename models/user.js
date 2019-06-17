var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");


var userSchema=new mongoose.Schema({
    username:{type:String, unique:true},
    password:String,
	Avatar:String,
	firstName:String,
	lastName:String,
	Email:String,
	notifications: [
    	{
    	   type: mongoose.Schema.Types.ObjectId,
    	   ref: 'Notification'
    	}
    ],
    followers: [
    	{
    		type: mongoose.Schema.Types.ObjectId,	
    		ref: 'User'
    	}
    ],
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

module.exports=mongoose.model("User",userSchema);var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");


var userSchema=new mongoose.Schema({
    username:{type:String, unique:true},
    password:String,
	Avatar:String,
	firstName:String,
	lastName:String,
	Email:String,
	notifications: [
    	{
    	   type: mongoose.Schema.Types.ObjectId,
    	   ref: 'Notification'
    	}
    ],
    followers: [
    	{
    		type: mongoose.Schema.Types.ObjectId,	
    		ref: 'User'
    	}
    ],
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