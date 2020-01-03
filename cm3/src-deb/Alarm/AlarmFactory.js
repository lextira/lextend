
var AlarmRuleModule = require('./AlarmRule.js');
var DeviceAlarmRuleModule = require('./AlarmRuleDevice.js');

function AlarmFactory() {

    this.createAlarmInstanceFromType = function (type) {
        var result = null;
        if (type == "device") {
            result = new DeviceAlarmRuleModule.AlarmRuleDevice();
        }
        else {
            result = new AlarmRuleModule.AlarmRule();

        }

        return result;

    }
    
}


// export the class
module.exports =
 {
     AlarmFactory
 };
