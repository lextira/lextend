/*
   *      alarm:   { ruleName : "rrr",
                     type     : "device",
                     info     : {
                                    paramDefinitions: [
                                     {
                                          CO  : { minLimit : 100, maxLimit:200 },
                                          SO2 : { minLimit : 100, maxLimit:200 },
                                          AA  : { minLimit : 100, maxLimit:200 },
                                     }
                                    
                                    ]

                                  }
   *
   */

function AlarmRule() {
    this.ruleName = null;
    this.type = 0;
    this.message = null;
    
}

AlarmRule.prototype.toJson = function () {
    return JSON.stringify(this);
}

AlarmRule.prototype.parse = function (info) {
    console.log("AlarmRule-parse start", info.ruleName);
    this.ruleName = info.ruleName;
    this.type = info.type;
    this.clearingMode = info.clearingMode;
    this.timeInterval = info.timeInterval;
    this.combinedCondition = info.combinedCondition;
    this.message = info.message;
    console.log("AlarmRule-parse stop");
}

// export the class
module.exports =
 {
     AlarmRule
 };
