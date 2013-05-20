// are you ready for this?
$(function(){
	if (localStorage.username) {
		$('.register input').val(localStorage.username);
		$('.register textarea').focus();
	} else {
		$('.register input').focus();
	}

	if (localStorage.language) {
		$('.register .languages img[data-lang='+localStorage.language+']').addClass('active');
	}

	// handlebars message template
	var messageTemplate = '<div class="row message" data-id="{{id}}"> <div class="large-2 columns"> ' +
	'<p><img class="flag" src="img/{{langauge}}.png"/>'+
	'<strong> {{username}} </strong></p></div> ' +
	'<div class="large-10 columns"> <p class="text"> {{message}}</p> </div> </div> ';
	var messageTemplate = Handlebars.compile(messageTemplate);

  	// create username
	$('.register input').on('change', function(){
		localStorage.username = $(this).val();
		$.post("server/?request=new_user", { username: $(this).val(), language: $('.register .languages img.active').data('lang') });
	});

	// choose language
	$('.register .languages img').on('click touchstart', function(){
		$(this).siblings().removeClass('active');
		$(this).addClass('active');
		if ($('.register input').val().length >= 1) {
			$('.register textarea').focus();
		} else {
			$('.register input').focus();
		}
		localStorage.language = $(this).data('lang');
		$.post("server/?request=new_user", 
			{ username: $('.register input').val(), language: $(this).data('lang') }
		);
		getData();
	});

	// enter message
	$('.register textarea').keypress(function(e) {
	  if (e.keyCode == 13 && !e.shiftKey) {
	  	if ($(this).val().length >= 1 && $('.register input').val().length >= 1 && $('.register .languages img.active').length) {
	  		var message = $(this).val();
		  	var username = $('.register input').val();
		  	var language = $('.register .languages img.active').data('lang');
		  	e.preventDefault();
		  	$(this).val('');
		  	var data = { "username": username, "langauge": language, "message" : message, "id" : ''};
			var result = messageTemplate(data);
			$(result).addClass('loading').prependTo('.messages');
		  	$.post("server/?request=new_message", { username: username, language: language, message: message })
		  	.done(function(id) {
			  console.log(id);
			});
		  	$('.register .error').slideUp(100);
	  	} else {
	  		$('.register .error').slideDown(100);
	  	}
	  	
	  }
	});

	// firebase connections
	var firebase = new Firebase('https://world-chat.firebaseio.com/');
	var users = firebase.child('users');
	var messages = firebase.child('messages');

	// firebase data feed
  	getData = function(){
  		messages.limit(10).on('child_added', function (snapshot) {
	  		var response = snapshot.val();
	  		var reference = snapshot.name();
		  	var username = response.username;
		  	var language = response.language;
		  	var message = response.message;
		  	$('.messages [data-id='+reference+']').remove();
		  	if (message[localStorage.language]) {
			  	var data = { "id": reference, "username": username, "langauge": language, "message" : message[localStorage.language]};
			  	var result = messageTemplate(data);
				$('.messages .loading').hide();
			  	$(result).prependTo('.messages');
		  	} else {
		  		var data = { "id": reference, "username": username, "langauge": language, "message" : message[language]};
		  		var result = messageTemplate(data);
		  		if (localStorage.language) {
		  			$.post("server/?request=translate", { id: reference, message: message[language], from: language, to: localStorage.language })
			  		.done(function(response){
			  			$('.messages [data-id='+reference+']').find('p.text').html(response);
			  		});	
			  		$(result).prependTo('.messages').find('p.text').append('<span class="success label translating">Translating</span>');
		  		} else {
					$(result).prependTo('.messages');
		  		}
				$('.messages .loading').hide();
		  	}
		});
	}

	getData();

  	// foundation tooltips
	$(document).foundation();

});