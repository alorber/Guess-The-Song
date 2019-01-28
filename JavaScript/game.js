$(document).ready(function(){

	var device_id;
	var playlist_id;
	var playlist_tracks;
	var current_track;
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
				alert("game over! Out of lives!");
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
				alert("GAME OVER!");
				return;
			} 
		} 
		if ( (time_left_song <= 0 && game_mode == 0) || (time_left_game <=0 && game_mode == 1) ) {
			setGuessResponse("Guess Faster!");
			$("#Circle_timer").trigger('configure', {'fgColor': 'green'});
			$("#Circle_timer").css('color', 'green');
			if (game_mode == 1) {
				loseLife();
			}
			clearInterval(counter);
			playNext();
			return;
		}

		if (time_left_song <= 3 || time_left_game <= 3) {
			$("#Timer_div").effect("shake", {times: 1, distance: 10});
			$("#Circle_timer").trigger('configure', {'fgColor': '#b80000'});
			$("#Circle_timer").css('color', '#b80000');
		}

	}
	function startTimer(){
		counter = setInterval(timer, 1000);
	}
	//Plays next song
	function playNext(){
		$("#Circle_timer").trigger('configure', {'fgColor': 'green'});
		$("#Circle_timer").css('color', 'green')
		//Check if you are at end of playlist
		if (song_number == playlist_tracks.length) {
			alert("You finished the playlist");
		} else {
			let tracks_left = playlist_tracks.length - song_number;
			console.log("There are " + tracks_left + " tracks left.");
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

	//Load User Devices
	$("#Start_button").click(function(e){
		e.preventDefault;
		$("#Start_game").hide();
		$("#Head_text").text("Which device would you like to listen on?");
		//Loading Text
		$("#Loading_text_div").removeClass('hidden');
		$("#Spinner_div").removeClass('hidden');
		getDevices();
	});

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
			if (game_mode == 0) {
				score += (time_left_song + 1);
			} else {
				score++;
			}
			updateScore();
		} else {
			setGuessResponse("Nice Try!");
			if (game_mode == 0) {
				time_left_game -= 5;
				$("#Circle_timer").val(time_left_game).trigger('change');
			} else {
				loseLife()
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


});