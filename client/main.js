import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HTTP } from 'meteor/http';
import './main.html';

Template.stub.onCreated(function stubOnCreated() {
  
  if (!Meteor.isCordova) {
    return false;
  }

  //create a local mongo collection to store players
  LocalPlayers = new Mongo.Collection(null);

  //use `randomUser` service to get some fake player data
  HTTP.call('GET', 'https://randomuser.me/api', 
    {params: {results: 5, nat: 'us'}},
    function(error, data) {
      data.data.results.forEach(function(user, index, array) {
        var jerseyColor;
        Math.random() >= 0.5 ? jerseyColor = 'light' : jerseyColor = 'dark';
        LocalPlayers.insert({
          firstName: user.name.first,
          lastName: user.name.last,
          avatar: user.picture.large,
          number: Math.floor(Math.random() * 90 + 10),
          jerseyColor: jerseyColor,
          createdAt: new Date(),
          modifiedAt: null
        });
      });
    }
  );

  //define options for the plugin
  this.pluginOptions = {
    limit: 1, //number of recordings that can be captured
    maxDuration: 60, //max length in seconds
    players: LocalPlayers.find().fetch(), //player objects with name, avatar, etc
    orientation: 'landscape', // allowed orientation: 'landscape' | 'portrait' | 'both'
    resolution: '960x540', // video resolution 
    bitrate: 1.5 //bitrate in Megabits per second
  }

  //pass success data to this when plugin exits successfully
  //`videoPath` is the path to the recorded video on the local system
  //`cuepoints` is an array of captured moments with:
  // (1) playerIds, (2) universal timestamp of tap event, (3) # seconds into video of tap event
  this.onPluginSuccess = function(videoPath, cuepoints) {
  }

  //pass error to this when plugin exits unsuccessfully
  this.onPluginError = function(error) {
  }

});

Template.stub.helpers({
  isCordova() {
    return Meteor.isCordova
  }
});

Template.stub.events({
  'click button'(event, instance) {
    console.log(instance.pluginOptions);
    //call plugin -- change this to the name of whatever plugin you want to call
    navigator.device.capture.captureVideo(instance.onPluginSuccess, instance.onPluginError, instance.pluginOptions);
  },
});
