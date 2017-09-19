import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { HTTP } from 'meteor/http';
import { Random } from 'meteor/random';
import './main.html';

Template.stub.onCreated(function stubOnCreated() {
  
  if (!Meteor.isCordova) {
    //return false;
  }

  this.loading = new ReactiveVar(false);
  this.videoPath = new ReactiveVar(null);
  this.videoInfo = new ReactiveVar(null);
  this.resolution = new ReactiveVar('low');
  this.bitrate = new ReactiveVar(null);
  
  // this.videoPath = new ReactiveVar('video.mp4');
  // this.videoInfo = new ReactiveVar({
  //   width: 1920,
  //   height: 1080,
  //   orientation: 'landscape', // will be portrait or landscape
  //   duration: 3.541, // duration in seconds
  //   size: 6830126, // size of the video in bytes
  //   bitrate: 15429777 // bitrate of the video in bits per second
  // });

  //create a local mongo collection to store players
  LocalPlayers = new Mongo.Collection(null);

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
          let teamName;
          Random.fraction() >= 0.5 ? teamName = 'Team 1' : teamName = 'Team 2';
          LocalPlayers.insert({
            _id: Random.id(),
            firstName: user.name.first,
            lastName: user.name.last,
            avatar: user.picture.large,
            number: String( Math.floor(Random.fraction() * 90 + 10) ),
            jersey: '#cccccc',
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
          resolution: self.resolution.get(), // video resolution 
          bitrate: parseFloat( self.bitrate.get() ), //bitrate in Megabits per second
          frontcamera: false
        });

        self.loading.set(false);
      }
    );
  }

  this.getClipInfo = function(path) {
    const self = this;
    VideoEditor.getVideoInfo(
      (info) => {
        console.log(info);
        self.videoInfo.set(info);
      },
      (err) => {
        console.log('error getting video info');
        console.log(err);
      },
      {
        fileUri: path
      }
    );
  },

  //SAVE VIDEO
  this.saveVideo = function() {
    cordova.plugins.photoLibrary.saveVideo(this.videoPath.get(), 'Legends of Rec', this.onSaveVideoSuccess.bind(this), this.onSaveVideoError.bind(this));
  }

  this.onSaveVideoSuccess = function() {
    alert('video saved to Legends of Rec album');
  }
  
  this.onSaveVideoError = function(err) {
    if (err.startsWith('Permission')) {
      this.requestAuthorization();
    } else {
      alert('unable to save video');
      console.log(err);
    }
  }
  
  this.requestAuthorization = function() {
    const self = this;
    cordova.plugins.photoLibrary.requestAuthorization(
      () => {
        self.saveVideo();
      },
      (err) => {
        console.log('User did not grant permission');
        console.log(err);
      },
      {
        read: true,
        write: true
      }
    );
  }

});

Template.stub.helpers({
  isCordova() {
    //return Meteor.isCordova;
    return true;
  },
  numberPlayersOptions() {
    return Template.instance().numberPlayersOptions;
  },
  resolutions() {
    return ['low','medium','high','352x288','640x480','960x540'];
  },
  loading() {
    return Template.instance().loading.get();
  },
  videoPath() {
    return Template.instance().videoPath.get();
  },
  videoInfo() {
    return Template.instance().videoInfo.get();
  }
});

Template.stub.events({
  'change select#number-players'(event, instance) {
    var el = document.getElementById('number-players');
    instance.numberPlayers.set(el.options[el.selectedIndex].value);
  },
  'change select#resolution'(event, instance) {
    var el = document.getElementById('resolution');
    instance.resolution.set(el.options[el.selectedIndex].value);
  },
  'change input#bitrate'(event, instance) {
    var el = document.getElementById('resolution');
    instance.bitrate.set(document.getElementById('bitrate').value);
  },
  'click button#launch-plugin'(event, instance) {
    if (!instance.bitrate.get()) {
      alert('Please select a bitrate');
      return false;
    }
    LocalPlayers.remove({});
    instance.loading.set(true);
    instance.getOptions(function(options) {
      console.log(options)
      //call plugin -- change this to the name of whatever plugin you want to call
      window.plugins.legendscapture.captureVideo(
        function(data) {
          instance.videoPath.set(data.videoPath);
          instance.getClipInfo(data.videoPath);
        },
        function(err) {
          console.log('error exiting video capture');
          console.log(error);
        },
      options);
    });
  },
  'click #save-video'(event, instance) {
    instance.saveVideo(instance.videoPath.get());
  }
});
