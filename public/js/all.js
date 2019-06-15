$("form :input").attr("autocomplete", "off");
$('.main-link').hover(function(){
	$(this).addClass('enter');
},function(){
	$(this).removeClass('enter');
});
$(".comment-div").hover(function(){
	$('.del').addClass('sh');
		},function(){
	$('.del').removeClass('sh');
		});