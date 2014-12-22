/**
 * Created with JetBrains WebStorm.
 * User: smile
 * Date: 13/06/13
 * Time: 16:42
 * To change this template use File | Settings | File Templates.
 */


var config = require('./Config');
var _ = require('lodash');
var apn = require('apn');
var pushAssociations = require('./PushAssociations')
var log = require('debug')('pushserver:log');
var errlog = require('debug')('pushserver:error');

var push = function (tokens, payload) {
    apnSender().pushNotification(payload, tokens);
};

var buildPayload = function (options) {
    var notif = new apn.Notification(options.payload);

    notif.expiry = options.expiry || 0;
    notif.alert = options.alert;
    notif.badge = options.badge;
    notif.sound = options.sound;

    return notif;
};

var apnSender = _.once(function () {
    var apnConnection = new apn.Connection(config.get('apn').connection);

    apnConnection.on('transmissionError', onTransmissionError);
    initAppFeedback();

    return apnConnection;
});

var onTransmissionError = function (errorCode, notification, recipient) {
    errlog('Error while pushing to APN: ' + errorCode);

    // Invalid token => remove device
    if (errorCode === 8) {
        var token = recipient.toString('hex').toUpperCase();

        log('Invalid token: removing device ' + token );

        pushAssociations.removeDevice(token);
    }
};

var onFeedback = function (deviceInfos) {
    log('Feedback service, number of devices to remove: ' + deviceInfos.length);

    if(deviceInfos.length > 0){
        pushAssociations.removeDevices(deviceInfos.map(function (deviceInfo) {
            try {
                log('device to remove ' +  deviceInfo.device.token + ' time ' + deviceInfo.time)
                return deviceInfo.device.token.toString('hex');
            } catch (err) {
                errlog("Can not remove the device " + deviceInfo.device);
            }
        }));
    }
};

var initAppFeedback = function () {
    var apnFeedback = new apn.Feedback(config.get('apn').feedback)

    apnFeedback.on('feedback', onFeedback);
};

module.exports = {
    push: push,
    buildPayload: buildPayload
}