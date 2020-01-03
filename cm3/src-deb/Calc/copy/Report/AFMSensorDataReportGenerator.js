var X2JS = new require('x2js');
var x2js = new X2JS({ useDoubleQuotes: true });

var SensorManagerModule = require('../Device/SensorManager.js');
var sensorManager = new SensorManagerModule.SensorManager();
var async = require('async');

var DateUtilsModule = require('../Utils/DateUtils.js');
var dateUtils = new DateUtilsModule.DateUtils();

var DeviceManagerModule = require('../Device/DeviceManager.js');
var deviceManager = new DeviceManagerModule.DeviceManager();

function AFMSensorDataReportGenerator() {

    this.reportData = {};


    var findDeviceDownTime = function (dateString, deviceId, callBack) {


        deviceManager.getDeviceFromId(deviceId, function (device) {

            if (device != null) {

                console.log('date split start');
                var dts = dateString.split('.');

                var date = parseInt(dts[0]);
                var month = parseInt(dts[1]);
                var year = parseInt(dts[2]);

                var d = new Date(year, month - 1, date);

                var dateAtDevTimeZone = dateUtils.convertDateToTimeZone(d, device.timeZone);

                var logicalId = device.logicalDeviceId;
                var dayStartEpoch = dateAtDevTimeZone.valueOf();
                var dayTimeEnd = dateAtDevTimeZone.valueOf() + 24 * 60 * 60 * 1000;
                dayTimeEnd--;

                var sensorRTimeStart = null;
                var sensorRTimeEnd = null;

                async.parallel([
                        function (asyncCallBack) {
                            sensorManager.getLiveDataCount(logicalId, dayStartEpoch, dayTimeEnd, function (err, id, count) {
                                if (count > 0) {
                                    sensorManager.getLiveData(logicalId, 1, count - 1, dayStartEpoch, dayTimeEnd, function (err, sensorId, value) {

                                        if (err == null && value != null && value.length > 0) {
                                            sensorRTimeStart = value[0].data.receivedTime;
                                        }
                                        return asyncCallBack(sensorRTimeStart == null);

                                    });

                                }
                                else
                                    asyncCallBack(1);

                            });
                        },
                        function (asyncCallBack) {
                            sensorManager.getLiveData(logicalId, 1, 0, null, dayTimeEnd, function (err, sensorId, value) {
                                if (err == null && value != null && value.length > 0) {
                                    sensorRTimeEnd = value[0].data.receivedTime;
                                }
                                return asyncCallBack(sensorRTimeEnd == null);
                            });
                        }

                ],

                        function (err, results) {
                            if (err) {
                                callBack(1, null);
                            }
                            else {

                                var downTimePercent = 24 * 60 * 60 - ((sensorRTimeEnd - sensorRTimeStart) / 1000);
                                downTimePercent = (downTimePercent / (24 * 60 * 60)) * 100;

                                downTimePercent = downTimePercent.toFixed(2);
                                callBack(null, downTimePercent);
                            }
                        }
                    );



            }
            else
                callBack(1, null);
        });


        //sensorManager.g
    }

    this.process = function (deviceIdList, dayEpochStart, timeEnd, completionCallBack) {


        var myInst = this;
        var i = 0;
        var sensorList = [];


        var fetchData = function () {

            sensorManager.getSensorStats(deviceIdList[i].deviceId, null, dayEpochStart, timeEnd, true, false, false, 0, 0, function (err, result) {

                if (result != null && result.dailyStat != null) {
                    var statParams = {};
                    var statPerDay = {};
                    var dailyList = result.dailyStat;

                    var k = 0;
                    var processDevice = function () {

                        if (statPerDay[dailyList[k].key] == null) {
                            statPerDay[dailyList[k].key] = {};
                            statPerDay[dailyList[k].key]._Date = dailyList[k].key;



                            statPerDay[dailyList[k].key]._Id = deviceIdList[i].deviceId;
                            if (deviceIdList[i].location != null && deviceIdList[i].location.zone != null)
                                statPerDay[dailyList[k].key]._ZoneId = deviceIdList[i].location.zone;
                        }
                       

                        var statInfo = {
                            max: dailyList[k].statParams.max,
                            min: dailyList[k].statParams.min
                        };
                        if (dailyList[k].paramName == "receivedTime") {
                            var usageInHours = (statInfo.max - statInfo.min) / 1000;
                            usageInHours /= (60 * 60);

                            var downPercent = ((24 - usageInHours) / 24) * 100;
                            statPerDay[dailyList[k].key]._SLA = downPercent.toFixed(2);;
                        }
                        statPerDay[dailyList[k].key][dailyList[k].paramName] = statInfo;

                        //findDeviceDownTime(statPerDay[dailyList[k].key]._Date, deviceIdList[i].deviceId, function (err, downTime)
                        {

                            //if (err) {
                            //    downTime = 0;
                            //}
                            //statPerDay[dailyList[k].key]._SLA = downTime;

                            k++;
                            // find stat for next day
                            if (k < dailyList.length) {
                                processDevice();
                            }
                            else {

                                if (dailyList != null && dailyList.length > 0) {
                                    for (var dateKey in statPerDay) {
                                        sensorList.push(statPerDay[dateKey]);
                                    }

                                }

                                // check if all device compelted
                                i++;
                                if (i < deviceIdList.length)
                                    fetchData();
                                else {
                                    myInst.reportData = { "EnvironmentalSensorData": { "Sensor": sensorList } };
                                    if (sensorList == null || sensorList.length <= 0)
                                        delete myInst.reportData.EnvironmentalSensorData.Sensor;
                                    completionCallBack();
                                }

                            }

                        }
                        //);


                    }

                    if (k < dailyList.length) {
                        processDevice();
                    }
                    else {
                        i++;
                        if (i < deviceIdList.length)
                            fetchData();
                        else {
                            myInst.reportData = { "EnvironmentalSensorData": { "Sensor": sensorList } };
                            if (sensorList == null || sensorList.length <= 0)
                                delete myInst.reportData.EnvironmentalSensorData.Sensor;
                            completionCallBack();
                        }

                    }




                }

                //i++;
                //if (i < deviceIdList.length)
                //    fetchData();
                //else
                //{
                //    myInst.reportData = { "EnvironmentalSensorData": { "Sensor": sensorList } };
                //    if (sensorList == null || sensorList.length <= 0)
                //        delete myInst.reportData.EnvironmentalSensorData.Sensor;
                //    completionCallBack();
                //}

            });

        }

        if (i < deviceIdList.length)
            fetchData();

    }

    this.getReportAsXML = function () {

        var xmlHeader = '<?xml version="1.0" encoding="utf-8"?>\r\n';
        return xmlHeader+x2js.js2xml(this.reportData);
    }
}


// export the class
module.exports =
 {
     AFMSensorDataReportGenerator
 };