
var AlarmManagerModule = require('./AlarmManager.js'),
    SensorManagerModule = require('../Device/SensorManager.js'),
    alarmManager = new AlarmManagerModule.AlarmManager(),
    sensorManager = new SensorManagerModule.SensorManager();


function AlarmProcessor() {
    console.log("Alarm processor")
    this.lastRunTimeEpoch = null;
    this.startTime = new Date().valueOf();
    this.deviceRuleTimeStamp = {};
    this.noAlarmTimePeriod = 5;

    this.findLastRunEpoch = function (rule, deviceId,callBack) {
        var myInst = this;
        if (this.deviceRuleTimeStamp[rule.ruleName] != null && 
            this.deviceRuleTimeStamp[rule.ruleName][deviceId] != null) {

            if (rule.clearingMode == "None") {
                callBack(Math.max(this.deviceRuleTimeStamp[rule.ruleName][deviceId], 0));
                return;
            }
          

            var clearTime = -1;
            alarmManager.getAlarmRecords(rule.ruleName, 1, 0, null, null, function (err, records) {
                if (!err && 
                    records.length > 0) {
                    var record = records[0];
                    if (record.clearedTime != null)
                        clearTime = record.clearedTime;
                }
                console.log("*************ClearedTime", clearTime,myInst.deviceRuleTimeStamp[rule.ruleName][deviceId]);
                callBack(Math.max(myInst.deviceRuleTimeStamp[rule.ruleName][deviceId], clearTime));
            });



        }
        else {
            var clearTime = null;
            alarmManager.getAlarmRecords(rule.ruleName, 1, 0, null, null, function (err, records) {
                if (!err && records.length > 0) {
                    var record = records[0];
                    if (record.clearedTime != null)
                        clearTime = record.clearedTime;
                }
                console.log("cleartime",clearTime)
                callBack(clearTime!= null ? clearTime : null);
            });

        }

    }

    this.updateLastRunEpoch = function (ruleName, deviceId, epoch) {
        if (this.deviceRuleTimeStamp[ruleName] == null)
            this.deviceRuleTimeStamp[ruleName] = {};

        this.deviceRuleTimeStamp[ruleName][deviceId] = epoch;

    }

    this.addAlarmRecords = function (records, callBack) {

        var i = 0;

        var addRecord = function () {
            var record = records[i];

            alarmManager.addAlarmRecord(record, function (err) {

                i++;
                if (i < records.length)
                    addRecord();
                else
                    callBack();
            });

        }

        if (i < records.length)
            addRecord();
        else
            callBack();
    }

    var filterLiveData = function (liveData) {
        var epochNow = new Date().valueOf();
        var filteredLiveData = [];
        if (liveData.length > 0) {
            for (var i = 0; i < liveData.length; i++) {

                var diff = Math.abs(liveData[i].data.receivedTime - epochNow) / 1000;
                if (diff > 60 * 60) {
                    // this sample from 1 hour back. skip this.
                    continue;
                }
                filteredLiveData.push(liveData[i]);
            }
        }

        return filteredLiveData;
    }

    var checkIfAlarmActive = function (rule,genstatus,timeStamp, callBackStatus) {
        console.log("Alarm active")
        var status = false;
        alarmManager.getAlarmRecords(rule.ruleName, 1, 0, null,null, function (err, records) {
            if (!err && records.length > 0) {
                var record = records[0];
                if (record.alarmStatus != "Active") {
                    status = false;
                    callBackStatus(status);
                }
                else {
                    if(genstatus == 1){
                        record.alarmStatus = "NotActive";
                        status =false
                        //record.timeStamp=timeStamp
                        alarmManager.updateAlarmRecords(record, function (err) {
                            callBackStatus(status);
                        })
                    }
                    if (rule.clearingMode == "Manual") {
                        status = true;
                        callBackStatus(status);
                    }
                    else if (rule.clearingMode == "Time") {
                        var now = new Date().valueOf();
                        var diff = (now - record.timeStamp) / 1000;
                        status = diff < rule.timeInterval;

                        if (!status) {
                            // update record
                            record.alarmStatus = "NotActive";
                            alarmManager.updateAlarmRecords(record, function (err) {
                                callBackStatus(status);
                            });
                        }
                    }
                }

                
            }
            else
            {
                callBackStatus(status);
            }
        });
    }
    this.processDeviceRules = function (deviceAlarmRules, callBackProceeDeviceRule) {

        var i = 0;

        var alarmRecords = [];
        var myInst = this;
        var processAlarms = function (rule, liveDataForDevice, completeCallBack) {
            console.log("process alarms called      ",liveDataForDevice)
            var isParameterProcessWithAnd = rule.combinedCondition;

            var alarmRecord = {
                ruleName: rule.ruleName,
                timeStamp: new Date().valueOf(),
                liveLog: []
            };

            //check rule in every devie and report alarm if rule is valid any one of device.
            var k = 0;
            //for (; k < liveDataForDevice.length; k++)
            var processLiveDataForDevice = function () {

                var deviceLog = {
                    deviceId: liveDataForDevice[k].deviceId,
                    paramValues: {},
                    timeStamp: -1
                };

                var paramData = liveDataForDevice[k].data;
                var q = 0;

                var processLiveDataSample = function () {



                    var dataSampleTime = paramData[q].data.receivedTime;
                    deviceLog.timeStamp = Math.max(dataSampleTime, deviceLog.timeStamp);
                    console.log("greater timestamp",dataSampleTime,deviceLog.timeStamp,(dataSampleTime> deviceLog.timeStamp))
                    var deviceAlarm = false;

                    var nextSample = function () {
                        q++;
                        if (q < paramData.length)
                            processLiveDataSample();
                        else {
                            k++;
                            if (deviceAlarm)
                                alarmRecord.liveLog.push(deviceLog);

                            if (k < liveDataForDevice.length) {
                                processLiveDataForDevice();
                            }
                            else {
                                completeCallBack(alarmRecord.liveLog.length > 0, alarmRecord);
                            }
                        }
                    }
                    // if already same record exist skip this.

                    alarmManager.getAlarmRecordWithLiveLogTimeStamp(deviceLog.timeStamp, function (err1, existRecord) {
                        var isAlarmGenerated = false;
                        if (!existRecord || existRecord.length <= 0) {
                            
                            console.log("no existrecord ,if executed",existRecord)
                            for (paramName in rule.info.paramDefs) {
                                var minLimit = rule.info.paramDefs[paramName].minLimit;
                                var maxLimit = rule.info.paramDefs[paramName].maxLimit;
                                var value = paramData[q].data[paramName];
                                var alarmOn = false;
                                if (minLimit != null && value < minLimit) {
                                    alarmOn = true;
                                }

                                if (maxLimit != null && value > maxLimit) {
                                    alarmOn = true;
                                }
                                if (deviceLog.paramValues[paramName] == null)
                                    deviceLog.paramValues[paramName] = {
                                        displayName: rule.info.paramDefs[paramName].displayName,
                                        logs: []
                                    };

                                if (isParameterProcessWithAnd) {
                                    if (alarmOn) {
                                        isAlarmGenerated = true;
                                        deviceLog.paramValues[paramName].logs.push({ "value": value, timeStamp: dataSampleTime });
                                    }
                                    else {
                                        isAlarmGenerated = false;
                                        break;
                                    }

                                }
                                if (!isParameterProcessWithAnd && alarmOn) {
                                    isAlarmGenerated = true;
                                    // alarm generated for the param.
                                    deviceLog.paramValues[paramName].logs.push({ "value": value, timeStamp: dataSampleTime });
                                }


                            }

                            if (isAlarmGenerated) {
                                deviceAlarm = true;

                            }
                            nextSample();

                        }
                        else{
                            console.log("existrecord, else executed")
                            for (paramName in rule.info.paramDefs) {
                                var minLimit = rule.info.paramDefs[paramName].minLimit;
                                var maxLimit = rule.info.paramDefs[paramName].maxLimit;
                                var value = paramData[q].data[paramName];
                                var alarmOn = false;
                                if (minLimit != null && value < minLimit) {
                                    alarmOn = true;
                                }

                                if (maxLimit != null && value > maxLimit) {
                                    alarmOn = true;
                                }
                                if (deviceLog.paramValues[paramName] == null)
                                    deviceLog.paramValues[paramName] = {
                                        displayName: rule.info.paramDefs[paramName].displayName,
                                        logs: []
                                    };

                                if (isParameterProcessWithAnd) {
                                    if (alarmOn) {
                                        isAlarmGenerated = true;
                                        deviceLog.paramValues[paramName].logs.push({ "value": value, timeStamp: dataSampleTime });
                                    }
                                    else {
                                        isAlarmGenerated = false;
                                        break;
                                    }

                                }
                                if (!isParameterProcessWithAnd && alarmOn) {
                                    isAlarmGenerated = true;
                                    // alarm generated for the param.
                                    deviceLog.paramValues[paramName].logs.push({ "value": value, timeStamp: dataSampleTime });
                                }


                            }

                            if (isAlarmGenerated) {
                                deviceAlarm = true;

                            }
                            q++;
                            if (q < paramData.length)
                                processLiveDataSample();
                            else {
                                k++;
                                if (deviceAlarm)
                                    alarmRecord.liveLog.push(deviceLog);

                                if (k < liveDataForDevice.length) {
                                    processLiveDataForDevice();
                                }
                                else {
                                    completeCallBack(alarmRecord.liveLog.length > 0, 0);
                                }
                            }

                        }
                    });

                }

                if (q < paramData.length){
                    console.log("q and paramdata.length     ",q,"   ",paramData.length)
                    processLiveDataSample();
            
                }
            }

            if (k < liveDataForDevice.length) {
                console.log("k and livedatafordevice.length         ",k,"    ",liveDataForDevice.length)
                processLiveDataForDevice();
            }
            else {
                console.log("k = livedatafordevice.length")
                completeCallBack(alarmRecord.liveLog.length > 0, alarmRecord);
            }

        }

        var processRule = function () {

            var rule = deviceAlarmRules[i];
            var liveDataForDevice = [];
            var deviceIds = rule.info.deviceIds;
            i++;

            var j = 0;
            var nextRule = function () {
                console.log("next rule")
                if (i < deviceAlarmRules.length)
                    processRule();
                else {
                    callBackProceeDeviceRule(alarmRecords);
                }
            }
            var fetchLiveData = function () {

                if (checkIfAlarmActive(rule,0,0, function (isActive) {
                    process()
                    // console.log("nextRule in fetchlivedata")
                   // nextRule()
                   /*
                    if (!isActive) {
                       // process();
                    }
                    else {
                        nextRule();
                    }
                    */
                }));

                var process = function () {
                    // fetch live data for device
                    console.log("var process")
                    myInst.findLastRunEpoch(rule, deviceIds[j].deviceId, function (lastRunEpochForDevice) {

                        // console.log("\nProcessing find lastRunEpoch", rule, deviceIds[j].deviceId, lastRunEpochForDevice)
                        if (lastRunEpochForDevice == null) {
                            // no record present for this rule, so take last 5 min sample from current time
                            var t0 = new Date().valueOf() - (myInst.noAlarmTimePeriod * 60 *100)//* 1000);
                            lastRunEpochForDevice = t0;//myInst.startTime;
                        }
                        var limitTemp = 1;
                        if (lastRunEpochForDevice != null) {
                            limitTemp = 10000;
                            lastRunEpochForDevice++;
                        }
                        console.log("data before sensor data",deviceIds[j].logicalDeviceId,lastRunEpochForDevice,limitTemp)
                        sensorManager.getLiveData(deviceIds[j].logicalDeviceId, limitTemp, 0, lastRunEpochForDevice, null, function (err, sensorId, info) {
                            console.log("snesormanager",info)
                            var filterd = null
							if (info != null){
								filterd = filterLiveData(info);
							}
                            
                            if (filterd != null && filterd.length > 0) {


                                liveDataForDevice.push({ deviceId: deviceIds[j].deviceId, data: filterd });
                                myInst.updateLastRunEpoch(rule.ruleName, deviceIds[j].deviceId, filterd[0].data.receivedTime);
                            }

                            j++;
                            if (j < deviceIds.length) {
                                fetchLiveData();
                            }
                            else {
                                processAlarms(rule, liveDataForDevice, function (isAlarmGen, recordAlarm) {
                                    console.log("wroom",recordAlarm,liveDataForDevice)

                                var finalchecks =new Promise (function(resolve,reject){
                                    console.log("finalchecks called")
                                    if (isAlarmGen && recordAlarm) {
                                        console.log("finalchecks first if")
                                        checkIfAlarmActive(rule,0,0,function(isActive){
                                            console.log("checkalarm daefwerq")
                                            // resolve("checkalarm incnjekscnwoe")

                                        if(!isActive){    
                                        recordAlarm = addClearingStatusToAlarmRecord(recordAlarm, rule);
                                        
                                        alarmRecords.push(recordAlarm);
                                        }
                                        resolve("checkalarm incnjekscnwoe")
                                    })
                                    console.log("if finalchecks")
                                    }
                                    if(!isAlarmGen && liveDataForDevice[0] ){
                                        console.log("finalchecks second if")
                                        var genstatus = 1
                                        checkIfAlarmActive(rule,genstatus,recordAlarm.timeStamp,function(){
                                            console.log("oqwidnoqnwecoe")
                                            resolve("oqw")
                                        })
                                    }
                                    if(!isAlarmGen && !liveDataForDevice[0]){
                                        console.log("finalchecks third if")
                                        resolve("ow")
                                    }
                                })
                             
                                finalchecks.then((s)=>{nextRule()})
                                    // console.log("next rule in processalarm")
                                    // nextRule();
                                });
                            }
                        });


                    });
                    

                }
            }


            if (j < deviceIds.length)
            {
                console.log("j and deviceids.length",j,"    ",deviceIds.length)
                fetchLiveData();
            }
            else {
                console.log(" j=deviceids.length    ")
                nextRule();
            }

        }

        if (i < deviceAlarmRules.length){
            console.log("i, devicealarmrules.length",i,"    ",deviceAlarmRules.length)
            processRule();
        }
        else
        {
            console.log("i = deviceAlarmRules.length")
            callBackProceeDeviceRule(alarmRecords);
        }
    }

    var addClearingStatusToAlarmRecord = function (recordAlarm, rule) {

        //var alarmRecord = {
        //    ruleName: rule.ruleName,
        //    timeStamp: new Date().valueOf(),
        //    liveLog: []
        //};

        if (rule.clearingMode != "None") {
            recordAlarm.alarmStatus = "Active";
        }

        return recordAlarm;



    }

    this.process = function (callBackProcessingCompleted) {
        console.log("this.process")
        var deviceAlarmRules = [];

        var myInst = this;
        alarmManager.getAlarmRuleCount("device", function (err, count) {

            var i = 0;
            var fetchDeviceAlarm = function () {
                alarmManager.getAlarmRuleAt("device", i, function (ruleInfo) {

                    if (ruleInfo != null) {
                        deviceAlarmRules.push(ruleInfo);
                    }

                    i++;
                    if (i < count)
                        fetchDeviceAlarm();
                    else {
                        // console.log("devicealarmrules",deviceAlarmRules.info)
                        myInst.processDeviceRules(deviceAlarmRules, function (alarmRecords) {
                            // alarmRecords hold the list
                            if (alarmRecords.length > 0) {
                                myInst.addAlarmRecords(alarmRecords, function () {
                                    // completed;
                                    callBackProcessingCompleted();
                                });

                            }
                            else {
                                callBackProcessingCompleted();
                            }
                        });
                    }

                });
            }

            if (i < count)
                fetchDeviceAlarm();
            else
                callBackProcessingCompleted();

        });



    }


}


// export the class
module.exports =
 {
     AlarmProcessor
 };
