import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';
import './main.html';

Template.stub.onCreated(function stubOnCreated() {
  
  if (!Meteor.isCordova) {
    return false;
  }

  this.loading = new ReactiveVar(false);
  this.videoPath = new ReactiveVar(null);

  //create a local mongo collection to store players
  LocalPlayers = new Mongo.Collection(null);

  //use `randomUser` service to get some fake player data
  HTTP.call('GET', 'https://randomuser.me/api', 
    {params: {results: 20, nat: 'us'}},
    (error, data) => {
      data.data.results.forEach(function(user, index, array) {
        let jerseyColor;
        let teamName;
        Random.fraction() >= 0.5 ? jerseyColor = 'light' : jerseyColor = 'dark';
        Random.fraction() >= 0.5 ? teamName = 'Team 1' : teamName = 'Team 2';
        LocalPlayers.insert({
          playerId: Random.id(),
          firstName: user.name.first,
          lastName: user.name.last,
          avatar: user.picture.large,
          number: Math.floor(Random.fraction() * 90 + 10),
          jersey: jerseyColor,
          teamName: teamName,
        });
      });
    }
  );

  // allow populating number of players from 1-20
  this.numberPlayers = new ReactiveVar(1);
  let arr = [];
  for (var i = 1; i <= 20; i++) {
    arr.push(i);
  }
  this.numberPlayersOptions = arr;

  //define options for the plugin
  this.getOptions = function(callback) {
    const self = this;
    //generate some fake players
    HTTP.call('GET', 'https://randomuser.me/api', 
      {params: {results: self.numberPlayers.get(), nat: 'us'}},
      (error, data) => {
        data.data.results.forEach(function(user, index, array) {
          let jerseyColor;
          let teamName;
          Random.fraction() >= 0.5 ? jerseyColor = 'light' : jerseyColor = 'dark';
          Random.fraction() >= 0.5 ? teamName = 'Team 1' : teamName = 'Team 2';
          LocalPlayers.insert({
            playerId: Random.id(),
            firstName: user.name.first,
            lastName: user.name.last,
            avatar: user.picture.large,
            number: Math.floor(Random.fraction() * 90 + 10),
            jersey: jerseyColor,
            teamName: teamName,
          });
        });
        // build object of plugin options
        // note: for now, maxDuration, resolution, orientation and bitrate are hardcoded
        callback({
          limit: 1, //number of recordings that can be captured
          duration: 60 * 60, //max length in seconds
          players: LocalPlayers.find().fetch(), //player objects with name, avatar, etc
          orientation: 'both', // allowed orientation: 'landscape' | 'portrait' | 'both'
          resolution: '960x540', // video resolution 
          bitrate: 1.5, //bitrate in Megabits per second
          frontcamera: false
        });

        self.loading.set(false);
      }
    );
  }

  //pass success data to this when plugin exits successfully
  //`videoPath` is the path to the recorded video on the local system
  //`moments` is an array of captured moments formatted like:
  // {
  //   cuepoint: Number (number of seconds into video that the user tapped),
  //   timestamp: Datetime (Universal timestamp of when user tapped),
  //   players: Array (array of player objects that user selected after each tap)
  // }

  this.onPluginSuccess = function(data) {
    instance.videoPath.set(data.videoPath);
  }

  //pass error to this when plugin exits unsuccessfully
  this.onPluginError = function(error) {
    console.log(error);
  }

});

Template.stub.helpers({
  isCordova() {
    return Meteor.isCordova;
  },
  numberPlayersOptions() {
    return Template.instance().numberPlayersOptions;
  },
  loading() {
    return Template.instance().loading.get();
  },
  videoPath() {
    return Template.instance().videoPath.get();
  }
});

Template.stub.events({
  'change select'(event, instance) {
    var el = document.getElementById('number-players');
    instance.numberPlayers.set(el.options[el.selectedIndex].value);
  },
  'click button'(event, instance) {
    LocalPlayers.remove({});
    instance.loading.set(true);
    instance.getOptions(function(options) {
      //call plugin -- change this to the name of whatever plugin you want to call
      window.plugins.legendscapture.captureVideo(function(data) {
        instance.videoPath.set('/local-filesystem' + data.videoPath);
      },
      instance.onPluginError.bind(instance), options);
    });
  },
});
