# meteor-cordova-plugin-stub
Stub for calling cordova plugins from a meteor app

## Install Meteor
`$ curl https://install.meteor.com/ | sh`

## Run app as XCODE project
From project directory, run the following to compile the app as an XCODE project

`meteor run ios-device`

## Install cordova plugin
From project directory, run the following swapping-in the name of desired cordova plugin (note inclusion of version number)

`meteor add cordova:plugin-name@0.0.1`

More on Meteor and Cordova here: https://guide.meteor.com/mobile.html#introduction

More on installing a local version of a Cordova plugin into a Meteor project: https://stackoverflow.com/questions/35938360/add-cordova-plugin-to-meteor-from-local-path

## Update cordova plugin options

Fake player data is generated and passed into the plugin (can select from 1-20 players).

All code for calling plugins and handling success/error callbacks is in `client/main.js`
