$(document).ready(function(){

	//Fade in starting text
	$("#P1").fadeIn(1000, function(){
		$("#P2").fadeIn(1500, function(){
			$("#P3").fadeIn(1500, function(){
				$("#P4").fadeIn(1500, function(){
					$("#P5").fadeIn(1500, function(){
						$("#P6").fadeIn(1500, function(){
							$("#Log_in_text").fadeIn(1000, function(){
								$("#Log_in_button").fadeIn(1000);
							});
						});
					});
				});
			});
		});
	});

	$(window).click(function(){
		$("#Instructions p").show();
		$("#Log_in_button").show();
		$("#Login").show();
		$("#Log_in_text").show();
	});

});