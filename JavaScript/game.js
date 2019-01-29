$(document).ready(function(){

	var device_id;
	var playlist_id;
	var playlist_tracks;
	var current_track;
	var playlist_over = false;
	var score = 0;
	var time_left_song = 10;
	var time_left_game = 60;
	var counter;
	var song_number = 1;
	//Keeps track of game mode: 0 = Time Challenge, 1 = Classic Mode
	var game_mode = 0;
	var lives = 3;
	
	//Updates the Score
	function updateScore(){
		$("#Score").text(score);
	}
	//Takes away a life
	function loseLife(){
		lives--;
		$("#Hearts li:last-child").effect("shake", {times: 1, distance: 5}).fadeOut(function(){ 
			$(this).remove(); 
			if (lives <= 0) {
				endGame();
			}
		});	
	}
	//Creates a 10 Second Timer
	function timer(){		
		time_left_game--;
		$("#Circle_timer").val(time_left_game).trigger('change');

		if (game_mode == 0) {
			time_left_song--;
			if (time_left_game < 0){
				endGame();
				return;
			} 
		} 
		if ( (time_left_song <= 0 && game_mode == 0) || (time_left_game <=0 && game_mode == 1) ) {
			setGuessResponse("Guess Faster!");
			timerGreen();
			if (game_mode == 1) {
				loseLife();
			}
			clearInterval(counter);
			playNext();
			return;
		}
		if (time_left_song <= 3 || time_left_game <= 3) {
			shakeTimer();
		}
	}
	//Starts the timer
	function startTimer(){
		counter = setInterval(timer, 1000);
	}
	//Turns timer red and shakes it
	function shakeTimer() {
		$("#Circle_timer").trigger('configure', {'fgColor': '#b80000'});
		$("#Circle_timer").css('color', '#b80000');
		$("#Timer_div").effect("shake", {times: 1, distance: 10});
	}
	//Turns timer green
	function timerGreen(){
		$("#Circle_timer").trigger('configure', {'fgColor': 'green'});
		$("#Circle_timer").css('color', 'green');
	}
	//Plays next song
	function playNext(){
		//Check if you are at end of playlist
		if (song_number == playlist_tracks.length) {
			playlist_over = true;
			endGame();
		} else {
			song_number++;
		}
		fetch('/play_next')
			.then(e => e.json())
			.then(data => {
				$("#List").empty();
				current_track = data.name;
				let chosenTracks = pickTracks();
				chosenTracks.forEach(function(track){
					$("#List").append('<li><a href="#" class="track_choices btn btn-success role=button">' 
						+ track + '</a></li>' );
				});
				time_left_song = 10;
				if (game_mode == 1) {
					time_left_game = 5;
					$("#Circle_timer").val(time_left_game).trigger('change');
				}
				startTimer();
				$(".track_choices").prop("disabled", false);
			}).catch(error => {console.log(error)});
	}
	//Picks The Song Options
	function pickTracks(){
		let chosenTracks = [];
		//Randomly chooses the other options
		for(i = 0; i < 3; i++){
			let random = Math.floor(Math.random() * (playlist_tracks.length));
			if(Math.floor(Math.random() * 4) == 3 && chosenTracks.indexOf(current_track) == -1){
				chosenTracks.push(current_track);
			}
			if(chosenTracks.indexOf(playlist_tracks[random].track.name) == -1 
					&& current_track !== playlist_tracks[random].track.name){
				chosenTracks.push(playlist_tracks[random].track.name);
			} else {
				i--;
			}
		}
		if(chosenTracks.indexOf(current_track) == -1){
			chosenTracks.push(current_track);
		}
		return chosenTracks;
	}
	//Sets guess response
	function setGuessResponse(text){
		$("#Guess_response").text(text);
		$("#Guess_response").fadeIn(function(){
			setTimeout(function(){
				$("#Guess_response").fadeOut();
			}, 500);
		});
	}
	//Gets user devices
	function getDevices(){
		fetch('/get_user_devices')
			.then(e => e.json())
			.then(data => {
				$("#Spinner_div").addClass('hidden');
				//Checks if there are no active devices
				if (Object(data).length == 0) {
					$("#Loading_text").text("No devices found! Please open Spotify on one of your devices"
						+ " and click the button below to try again.");
				} else {
					$("#Loading_text_div").addClass('hidden');
				}
				//Loads device options
				data.forEach(function(device){
					$("#List").append('<li><a href="#" class="device btn btn-outline-success" id=' 
						+ device.id + ' role = "button">' + device.name + '</a></li>');
				});
				$("#List").append('<li><a href="#" id="Reload_devices" class="btn btn-outline-warning"' 
					+ 'role="button">Reload Devices</a></li>');
			}).catch(error => {alert("Problem loading devices: " + error)});
	}
	//Clears screen and shows game over screen
	function endGame(){
		clearInterval(counter);
		$("#List").empty();
		$("#Head_text").addClass("hidden");
		$("#Pause_div").addClass('hidden');
		$("#Timer_div").addClass('hidden');
		$("#Score_div").addClass('hidden');
		$("#Playlist_header").addClass('hidden');
		$("#Hearts_div").addClass('hidden');
		$("#Guess_response").addClass('hidden');
		fetch('/pause').catch(error => {console.log(error)});
		var opening_text = "Well Done! You really know your music!";
		var score_text = "Your score was " + score;
		//Changes text depending on score and game mode
		if (game_mode == 1) {
			if (score == 1){
				score_text = "You knew " + score + " song";
			} else {
				score_text = "You knew " + score + " songs";
			}
			if (score < 10) {
				opening_text = "Nice Try! You need to listen to some more music.";
			}
		} else if (game_mode == 0 && score < 100) {
			opening_text = "Nice Try! You need to listen to some more music.";
		}
		if (playlist_over) {
			opening_text = "Wow! You completed the playlist! You really know your stuff!";
		}
		$("#Game_over_text").html("Game Over!<br/>" + opening_text + "</br>" + score_text);
		$("#Game_over_div").removeClass('hidden');
		$("#List").append('<li><a href="#" class="btn btn-success" id="Play_again" role="button">Play Again</a></li>');
		$("#List").append('<li><a href="https://accounts.spotify.com/en/logout" '
			+ 'class="btn btn-danger" id="Game_over_logout" role="button">Log Out</a></li>');
	}

	//Load User Devices
	$("#Start_button").click(function(e){
		e.preventDefault();
		$("#Start_game").hide();
		$("#Head_text").text("Which device would you like to listen on?");
		//Loading Text
		$("#Loading_text_div").removeClass('hidden');
		$("#Spinner_div").removeClass('hidden');
		getDevices();
	});
	//Reload devices button
	$("body").on("click", "#Reload_devices", function(e){
		e.preventDefault();
		$("#List").empty();
		$("#Loading_text").text("Loading...");
		$("#Loading_text_div").removeClass('hidden');
		$("#Spinner_div").removeClass('hidden');
		getDevices();
	});

	//Load User Playlists
	$("body").on("click", ".device", function(e){
		e.preventDefault();
		$("#Head_text").text("Which playlist would you like to listen to?");
		device_id = $(this).attr("id");
		$("#List").empty();
		fetch('/get_user_playlists')
			.then(e => e.json())
			.then(data => {
				//Adds button for each playlist
				data.forEach(function(playlist){
					$("#List").append('<li><a href="#" class="playlistName btn btn-outline-success" data-id='
						+ playlist.id + ' data-uri =' + playlist.uri +'>' + playlist.name + '</a></li>');
				});	
			}).catch(error => {alert("Problem loading playlists: " + error)});
	});

	$("body").on("click", ".playlistName", function(e){
		$("#List").empty();
		$("#Playlist_header").text("Playlist: " + $(this).text());
		playlist_id = $(this).attr("data-id");
		playlist_uri = $(this).attr("data-uri");
		$("#Head_text").text("Which game mode would you like to play?");
		//Adds the two game buttons
		$("#List").append('<li><a href="#" class="gameMode btn btn-outline-success" data-html="true" id="Time_challenge"' 
			+ ' role="button" data-mode="0" data-toggle="tooltip" data-placement="right" ' 
			+ 'title="60 seconds</br>10 seconds per song ' 
			+ '</br>The faster you answer the more points you will score</br>'
			+ 'An incorrect answer will subtract 5 seconds"> Time Challenge </a></li>');
		$("#List").append('<li><a href="#" class="gameMode btn btn-outline-success" id="Classic_mode" role="button"'
			+ ' data-mode="1" data-toggle="tooltip" data-placement="left" data-html="true"'
			+ ' title="3 lives</br>5 seconds per song</br>1 point per correct answer"> Classic Mode </a></li>');
		//Enables tooltips
		if (/Mobi|Android/i.test(navigator.userAgent)) {
    		$("#Rules_div").removeClass('hidden');
		} else {
			$("body").tooltip({ selector: '[data-toggle="tooltip"]' });
		}
	});


	//Load Playlist Tracks and Begin Game
	$("body").on("click", ".gameMode", function(e){
		$("#Rules_div").addClass('hidden');
		$(".gameMode").tooltip('dispose');
		$("#List").empty();
		$("#Head_text").text("");
		game_mode = $(this).attr("data-mode");
		//Sets up clock for classic mode
		if (game_mode == 1) {time_left_game = 5;}
		//Load Playlist Tracks
		fetch('/get_playlist_tracks/' + playlist_id)
			.then(e => e.json())
			.then(data => {
				playlist_tracks = data;
				fetch('/play_playlist/' + device_id + '/' + playlist_uri)
					.then(e => e.json())
					.then(data => {
						$("#Head_text").text("Which song do you think is playing?");
						current_track = data.name;
						var chosenTracks = pickTracks();
						//Creates button for each track choice
						chosenTracks.forEach(function(track){
							$("#List").append('<li><a href="#" class="track_choices btn btn-success role=button">' + track + '</a></li>' );
						});
						$("#Pause_div").removeClass('hidden');
						$("#Circle_timer").knob({
							'max': time_left_game,
							'readOnly': true,
							'fgColor': 'green'
						});
						$("#Circle_timer").value = 5;
						$("#Timer_div").removeClass('hidden');
						$("#Score_div").removeClass('hidden');
						$("#Playlist_header").removeClass('hidden');
						if (game_mode == 1) {
							$("#Hearts_div").removeClass('hidden');
						}
						updateScore();
						startTimer();
					}).catch(error => {console.log("Problem playing music: " + error)});
			});
	});

	//Checks if answer was correct and updates score
	$("body").on("click", ".track_choices", function(e){
		//Stops multiple clicks
		$(".track_choices").prop("disabled", true);
		$("Guess_response").hide();
		if ($(this).text() == current_track) {
			setGuessResponse("CORRECT!");
			timerGreen();
			if (game_mode == 0) {
				score += (time_left_song + 1);
			} else {
				score++;
			}
			updateScore();
		} else {
			setGuessResponse("Nice Try!");
			if (game_mode == 0) {
				shakeTimer();
				time_left_game -= 5;
				$("#Circle_timer").val(time_left_game).trigger('change');
				setTimeout(function(){
					timerGreen();
				}, 400);
			} else {
				timerGreen();
				loseLife();
			}	
		}
		clearInterval(counter);
		playNext();
	});

//Pause Menu Buttons
	//Pause Button
	$("#Pause_button").click(function(e){
		e.preventDefault;
		clearInterval(counter);
		fetch('/pause').catch(error => {console.log(error)});
	});
	//Resume Button
	$("#Resume_button").click(function(e){
		e.preventDefault;
		startTimer();
		fetch('/play').catch(error => {console.log(error)});
	});

	let page = location;
	//Reload Button
	$("#Reload_button").click(function(e){
		e.preventDefault;
		page.reload();
	});

	$("body").on("click", "#Play_again", function(e){
		page.reload();
	});


});