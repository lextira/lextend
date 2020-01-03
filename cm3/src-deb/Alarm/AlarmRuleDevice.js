var AlarmModule = require('./AlarmRule.js');


/*
   *      alarm:   { ruleName : "rrr",
                     type     : "device",
                     info     : {
                                    paramDefinitions: {
                                          CO  : { minLimit : 100, maxLimit:200 },
                                          SO2 : { minLimit : 100, maxLimit:200 },
                                          AA  : { minLimit : 100, maxLimit:200 },
                                     }
                                  }
   *
   */

function AlarmRuleDevice() {

    this.info = null;

    this.parse = function (jsonObject) {
        console.log("AlarmRuleDevice-parse start");
        this.parent.parse.call(this, jsonObject);
        this.info = jsonObject.info;
        console.log("AlarmRuleDevice-parse stop");
    }
}

AlarmRuleDevice.prototype = new AlarmModule.AlarmRule();
AlarmRuleDevice.prototype.constructor = AlarmRuleDevice;
AlarmRuleDevice.prototype.parent = AlarmModule.AlarmRule.prototype;


// export the class
module.exports =
{
    AlarmRuleDevice
};