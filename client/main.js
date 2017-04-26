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
    duration: 60, //max length in seconds
    players: LocalPlayers.find().fetch() //player objects with name, avatar, etc
  }

  //pass success data to this when plugin exits successfully
  this.onPluginSuccess = function(capturedStuff) {
    console.log(capturedStuff);
  }

  //pass error to this when plugin exits unsuccessfully
  this.onPluginError = function(error) {
    console.log(error);
  }

});

Template.stub.helpers({
  isCordova() {
    return Meteor.isCordova
  }
});

Template.stub.events({
  'click button'(event, instance) {
    //call plugin -- change this to the name of whatever plugin you want to call
    navigator.device.capture.captureVideo(instance.onPluginSuccess, instance.onPluginError, instance.pluginOptions);
  },
});
