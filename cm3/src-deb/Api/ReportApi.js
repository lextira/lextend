
var  responseModule =  require('../HubResponse');

var  requestValidationModule =  require('../RequestValidation.js');
var requestValidation = new  requestValidationModule.RequestValidation();

var DeviceManagerModule = require('../Device/DeviceManager.js');
var deviceManager = new  DeviceManagerModule.DeviceManager();

var AFMSensorDataReportGeneratorModule = require("../Report/AFMSensorDataReportGenerator.js");
var afmSensorDataReportGenerator = new AFMSensorDataReportGeneratorModule.AFMSensorDataReportGenerator();



var AFMSensorDataReportType1GeneratorModule = require("../Report/AFMSensorDataReportType1Generator.js");
var afmSensorDataReportType1Generator = new AFMSensorDataReportType1GeneratorModule.AFMSensorDataReportType1Generator();

function ReportApi(express)
{

    var dailyReportXmlGenerator = function (req, res,type) {
        var hubResponse = new responseModule.HubResponse();
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else {

                if (req.query.timeStart == null) {
                    var response = null;
                    response = hubResponse.getErrorResponse(-1, "Invalid query parameters. Missing timeStart parameter");
                    res.end(response);
                }

                var deviceList = [];
                deviceManager.getDeviceCount(null, function (err, count) {
                    if (count > 0) {

                        var devIndex = 0;
                        var fetchDeviceInfo = function () {

                            deviceManager.getDeviceAt(null, devIndex, function (result) {
                                deviceList.push(result);

                                devIndex++;
                                if (devIndex < count)
                                    fetchDeviceInfo();
                                else {
                                    createXMLReport();
                                }

                            });
                        }

                        if (devIndex < count) {
                            fetchDeviceInfo();
                        }


                    }
                    else {
                        // nothing to process
                    }


                });



                var createXMLReport = function () {

                    var timeStart = null;
                    var timeEnd = null;
                    if (req.query.timeStart != null)
                        timeStart = req.query.timeStart;
                    if (req.query.timeEnd != null)
                        timeEnd = req.query.timeEnd;
                    else
                        timeEnd = timeStart;

                    var reportProcessor = afmSensorDataReportGenerator;
                    if (type == "type1"){
                        reportProcessor = afmSensorDataReportType1Generator;

                    }

                    reportProcessor.process(deviceList, timeStart, timeEnd, function () {

                        var resData = reportProcessor.getReportAsXML();
                        res.end(resData);

                    });
                }


            }
        });

    }
    express.get('/report/device/stat/daily/type1', function (req, res) {
        dailyReportXmlGenerator(req, res, "type1");
    });
    express.get('/report/device/stat/daily', function (req, res) {

        dailyReportXmlGenerator(req, res, "");
        //var hubResponse = new responseModule.HubResponse();
        //requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
        //    if (result == null) {
        //        var response = null;
        //        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
        //        res.end(response);

        //    }
        //    else {

        //        if (req.query.timeStart == null) {
        //            var response = null;
        //            response = hubResponse.getErrorResponse(-1, "Invalid query parameters. Missing timeStart parameter");
        //            res.end(response);
        //        }

        //        var deviceList = [];
        //        deviceManager.getDeviceCount(null, function (err, count) {
        //            if (count > 0) {

        //                var devIndex = 0;
        //                var fetchDeviceInfo = function () {

        //                    deviceManager.getDeviceAt(null, devIndex, function (result) {
        //                        deviceList.push(result);

        //                        devIndex++;
        //                        if (devIndex < count)
        //                            fetchDeviceInfo();
        //                        else {
        //                            createXMLReport();
        //                        }

        //                    });
        //                }

        //                if (devIndex < count) {
        //                    fetchDeviceInfo();
        //                }


        //            }
        //            else {
        //                // nothing to process
        //            }


        //        });



        //        var createXMLReport = function () {

        //            var timeStart = null;
        //            var timeEnd = null;
        //            if (req.query.timeStart != null)
        //                timeStart = req.query.timeStart;
        //            if (req.query.timeEnd != null)
        //                timeEnd = req.query.timeEnd;
        //            else
        //                timeEnd = timeStart;

        //            afmSensorDataReportGenerator.process(deviceList, timeStart, timeEnd, function () {

        //                var resData = afmSensorDataReportGenerator.getReportAsXML();
        //                res.end(resData);

        //            });
        //        }


        //    }
        //});

    });




}

// export the class
module.exports =
{
     ReportApi
};
