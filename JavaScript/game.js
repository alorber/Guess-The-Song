$(document).ready(function(){

	var device_id;
	var playlist_id;
	var playlist_tracks;
	var current_track;
	var score = 0;
	var time_left_song = 10;
	var time_left_game = 60;
	var counter;

	//Updates the Score
	function updateScore(){
		$("#Score").text(score);
	}
	//Creates a 10 Second Timer
	function timer(){
		time_left_song--;
		time_left_game--;
		$("#Circle_timer").val(time_left_game).trigger('change');

		if (time_left_game < 0){
			alert("GAME OVER!");
			return;
		} 
		if (time_left_song <= 0) {
			$("#Guess_response").text("Guess Faster!");
			$("#Circle_timer").trigger('configure', {'fgColor': 'green'});
			$("#Circle_timer").css('color', 'green')
			clearInterval(counter);
			playNext();
			return;
		}

		if (time_left_song <= 3) {
			$("#Timer_div").effect("shake", {times: 1, distance: 10});
			$("#Circle_timer").trigger('configure', {'fgColor': '#b80000'});
			$("#Circle_timer").css('color', '#b80000');
		}

	}
	function startTimer(){
		counter = setInterval(timer, 1000);
	}

	function playNext(){
		$("#Circle_timer").trigger('configure', {'fgColor': 'green'});
		$("#Circle_timer").css('color', 'green')

		fetch('/play_next')
			.then(e => e.json())
			.then(data => {
				$("#List").empty();
				current_track = data.name;
				let chosenTracks = pickTracks();
				chosenTracks.forEach(function(track){
					$("#List").append('<li><a href="#" class="track_choices btn btn-success role=button">' + track + '</a></li>' );
				});
				time_left_song = 10;
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
			if(chosenTracks.indexOf(playlist_tracks[random].track.name) == -1 && current_track !== playlist_tracks[random].track.name){
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

	//Load User Devices
	$("#Start_button").click(function(e){
		e.preventDefault;
		$("#Start_game").hide();
		$("#Head_text").text("Which device would you like to listen on?");
		//Loading Text
		$("#Loading_text_div").removeClass('hidden');
		$("#Spinner_div").removeClass('hidden');

		fetch('/get_user_devices')
			.then(e => e.json())
			.then(data => {
				$("#Spinner_div").addClass('hidden');
				//Checks if there are no active devices
				if (Object(data).length == 0) {
					$("#Loading_text").text("No devices found! Please open Spotify on one of your devices and click the button below to try again.");
				} else {
					$("#Loading_text_div").addClass('hidden');
				}
				//Loads device options
				data.forEach(function(device){
					$("#List").append('<li><a href="#" class="device btn btn-outline-success" id=' + device.id + ' role = "button">' + device.name + '</a></li>');
				});
			}).catch(error => {alert("Problem loading devices: " + error)});
	})

	//Load User Playlists
	$("body").on("click", ".device", function(e){
		e.preventDefault();
		$("#Head_text").text("Which playlist would you like to listen to?");
		device_id = $(this).attr("id");
		$("#List").empty();
		fetch('/get_user_playlists')
			.then(e => e.json())
			.then(data => {
				data.forEach(function(playlist){
					$("#List").append('<li><a href="#" class="playlistName btn btn-outline-success" data-id=' + playlist.id + ' data-uri =' + playlist.uri +'>' + playlist.name + '</a></li>');
				});	
			}).catch(error => {alert("Problem loading playlists: " + error)});
	});

	//Load Playlist Tracks and Begin Game
	$("body").on("click", ".playlistName", function(e){
		$("#List").empty();
		$("#Head_text").text("Which song do you think is playing?");
		$("#Playlist_header").text("Playlist: " + $(this).text());
		playlist_id = $(this).attr("data-id");
		playlist_uri = $(this).attr("data-uri");
		//Load Playlist Tracks
		fetch('/get_playlist_tracks/' + playlist_id)
			.then(e => e.json())
			.then(data => {
				playlist_tracks = data;
				fetch('/play_playlist/' + device_id + '/' + playlist_uri)
					.then(e => e.json())
					.then(data => {
						//console.log(data);
						current_track = data.name;
						var chosenTracks = pickTracks();
						chosenTracks.forEach(function(track){
							$("#List").append('<li><a href="#" class="track_choices btn btn-success role=button">' + track + '</a></li>' );
						});
						$("#Pause_div").removeClass('hidden');
						$("#Circle_timer").knob({
							'max': time_left_game,
							'readOnly': true,
							'fgColor': 'green'
						});
						$("#Timer_div").removeClass('hidden');
						$("#Score_div").removeClass('hidden');
						$("#Playlist_header").removeClass('hidden');
						updateScore();
						startTimer();
					}).catch(error => {console.log("Problem playing music: " + error)});
			});
	});
	//Checks if answer was correct and updates score
	$("body").on("click", ".track_choices", function(e){
		//Stops multiple clicks
		$(".track_choices").prop("disabled", true);
		if ($(this).text() == current_track) {
			$("#Guess_response").text("CORRECT!");
			score += (time_left_song + 1);
			updateScore();
		} else {
			$("#Guess_response").text("NICE TRY!");
			time_left_game -= 5;
			$("#Circle_timer").val(time_left_game).trigger('change');
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