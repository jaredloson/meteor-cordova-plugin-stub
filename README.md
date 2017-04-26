# meteor-cordova-plugin-stub
Stub for calling cordova plugins from a meteor app

# install meteor
`$ curl https://install.meteor.com/ | sh`

# run app as XCODE project
From project directory, run the following to compile the app as an XCODE project
`meteor run ios-device`

# install cordova plugin
From project directory, run the following (note inclusion of version number)
`meteor add cordova:plugin-name@0.0.1

# update cordova plugin options
All code for calling plugins and handling success/error callbacks is in `main.js`
