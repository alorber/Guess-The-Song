
var express = require('express');
var app = express();

//Load ejs
var ejs = require('ejs');
app.set('view engine', 'ejs');

app.use(express.static('/Users/AndrewLorber/Desktop/Spotify Web App/'));

//Load the Spotify Node API
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
  clientId: '###',
  clientSecret: '###',
  redirectUri: 'http://localhost:8080/callback'
});

var scopes = ['playlist-read-private', 'playlist-read-collaborative', 'user-modify-playback-state', 
	'user-read-currently-playing', 'user-read-private', 'user-library-read', 'user-read-playback-state'],
	state = '123456';

var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

//Homepage
app.get('/', function(req, res){
	res.render('index', {authurl: authorizeURL});
});

var tokenExpirationEpoch;

//Redirect URI
app.get('/callback', function(req, res){
	
	var code = req.query.code;

	spotifyApi.authorizationCodeGrant(code).then(
		function(data) {
		    //Set the access token on the API object to use it in later calls
		    spotifyApi.setAccessToken(data.body['access_token']);
		    spotifyApi.setRefreshToken(data.body['refresh_token']);

			//Save the amount of seconds until the access token expired
		    tokenExpirationEpoch =
		      new Date().getTime() / 1000 + data.body['expires_in'];
		    console.log(
		      'Retrieved token. It expires in ' +
		        Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) +
		        ' seconds!'
		    );

		    res.redirect('/game');
		},
		function(err) {
	    console.log('Something went wrong!', err);
	  	}
	);
});

//Refreshes the Acces Token
var numberOfTimesUpdated = 0;

setInterval(function() {
  //Stop printing and refresh.
  if (++numberOfTimesUpdated > 5) {
    clearInterval(this);

    //Refresh token and print the new time to expiration.
    spotifyApi.refreshAccessToken().then(
      function(data) {
        tokenExpirationEpoch =
          new Date().getTime() / 1000 + data.body['expires_in'];
        console.log(
          'Refreshed token. It now expires in ' +
            Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) +
            ' seconds!'
        );
      },
      function(err) {
        console.log('Could not refresh the token!', err.message);
      }
    );
}}, 1000);

//Game Page
app.get('/game', function(req, res){

	spotifyApi.getMe()
  		.then(function(data) {
  			//console.log(data.body);
  			res.render('game', {
				name: data.body['display_name']
			});
  		}, function(err) {
    		console.log('Something went wrong!', err);
  		});

});

//Loads User Devices and Sends to Page
app.get('/get_user_devices', function(req, res){

	spotifyApi.getMyDevices()
		.then(function(data){
			//Checks if there are no devices active
			if (Object(data.body.devices).length == 0) {
				console.log("ERROR: No devices found!");
			}
			console.log("Device data sent");
			res.send(data.body.devices);
		}, function(err){
			console.log("Something went wrong", err);
		}).catch(error => {console.log(error)});

});

//Loads User Playlists and Sends to Page
app.get('/get_user_playlists', function(req, res){

	spotifyApi.getUserPlaylists()
		.then(function(data){
			console.log("User Playlists Sent");
			res.send(data.body.items);
		}, function(err){
			console.log('Something went wrong!', err);
		}).catch(error => {console.log(error)});

});

var playlist_id;
var track_data;
var track_start;

//Loads Playlists Tracks and Sends to Page
app.get('/get_playlist_tracks/:playlist_id', function(req, res){

	playlist_id = req.params.playlist_id;

	spotifyApi.getPlaylistTracks(playlist_id, { fields: 'items' })
		.then(function(data){
			console.log("Track Data Sent");
			res.send(data.body.items);
		}, function(err){
			console.log('Something went wrong!', err);
		}).catch(error => {console.log(error)});

});

//Play Selected Playlist on Selected Device and Sends Track to Page
app.get('/play_playlist/:device_id/:playlist_uri', function(req, res){

	spotifyApi.play({ device_id: req.params.device_id, context_uri: req.params.playlist_uri })
		.then(function(data){
			//Sets the playback to shuffle
			spotifyApi.setShuffle({state: 'true'})
				.then(function(data){
					console.log("Shuffle Set");
					//Skips to next song since it will always begin on first song in playlist
					spotifyApi.skipToNext()
						.then(function(data){
							//Delays to Give Device Time to Change Song
							setTimeout(function(data){
								console.log("Skipped song");
								//Gets name of current track and returns it to the game
								spotifyApi.getMyCurrentPlayingTrack()
									.then(function(data){
										//Skips to a random point in the song so it's easier to identify
										track_data = data.body.item;
										if (track_data.duration_ms >= 45000) {
											track_start = Math.floor(Math.random() * (track_data.duration_ms - 40000) + 15000);
										} else {
											track_start = 15000;
										}
										spotifyApi.seek(track_start)
											.then(function(data){			
												res.send(track_data);
											}, function(error){
												console.log(error);
											}).catch(error => {console.log(error)});
									}, function(error){
										console.log(error);	
									}).catch(error => {console.log(error)});
							}, 600);
						}, function(error){
							console.log(error);
						}).catch(error => {console.log(error)});
				}, function(err){
					console.log(err)
				}).catch(error => {console.log(error)});
		}, function(err){
			console.log(err);
		}).catch(error => {console.log(error)});

});

//Play next song in game and Sends Track to Page
app.get('/play_next', function(req, res){

	spotifyApi.skipToNext()
		.then(function(data){
			//Delays to Give Device Time to Change Song
			setTimeout(function(data){
				console.log("Skipped song");
				//Gets name of current track and returns it to the game
				spotifyApi.getMyCurrentPlayingTrack()
					.then(function(data){
						//Skips a bit into the song so easier to identify
						track_data = data.body.item;
						if (track_data.duration_ms >= 45000) {
							track_start = Math.floor(Math.random() * (track_data.duration_ms - 40000) + 15000);
						} else {
							track_start = 15000;
						}
						spotifyApi.seek(track_start).then(function(data){
							res.send(track_data);
						}, function(error){
							console.log(error);
						}).catch(error => {console.log(error)});
					}, function(error){
						console.log(error);
					}).catch(error => {console.log(error)});
			}, 200);
		}, function(error){
			console.log(error);
		}).catch(error => {console.log(error)});

});

app.get('/pause', function(req, res){
	
	spotifyApi.pause()
		.then(function(data){}, function(error){console.log(error)})
		.catch(error => {console.log(error)});

});

app.get('/play', function(req, res){

	spotifyApi.play()
		.then(function(data){}, function(error){console.log(error)})
		.catch(error => {console.log(error)});

});


app.listen(8080);