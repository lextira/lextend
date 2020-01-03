
var responseModule = require('../HubResponse.js');

var requestValidationModule = require('../RequestValidation.js');
var requestValidation = new requestValidationModule.RequestValidation();

var SensorManagerModule = require('../Device/SensorManager.js');
var sensorManager = new SensorManagerModule.SensorManager();

var thirdpartyrequestValidationModule=require('../ThirdPartyRequestValidation.js')
var thirdpartyrequestValidation= new thirdpartyrequestValidationModule.ThirdPartyRequestValidation();



const rateLimit = new require("express-rate-limit");
 
const apiLimiter = rateLimit({
    
    windowMs:1000*60*60,
    max:100,

  
});

function SensorApi(express) {

	//express.use(apiLimiter);
    express.get('/device/sensor/livedata/v1/count', function (req, res) {
        // device id will not be logical for this API
        express.use(apiLimiter);
        var hubResponse = new responseModule.HubResponse();
        thirdpartyrequestValidation.isValidThirdPartyuser(req.query.apikey, function(result){
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else{
               // getLiveDataCount(req, res, false);
                if (req.query != null && req.query.deviceIds != null) {


                    var timeStart = req.query.timeStart;
                    var timeEnd = req.query.timeEnd;
                    var listDevIds = req.query.deviceIds.split(',');

                    var listResult = [];
                    var lastDevId = listDevIds[listDevIds.length - 1];
                    console.log('getting data', listDevIds);
                    var i = 0;
    
                    var funcName = 'getLiveDataCountFromDeviceId';

                    

                    var fetchSensor = function (err, sensorId, value) {
                        if (err == null) {
                            var resultPerDevice = { deviceId: sensorId, count: value };
                            listResult.push(resultPerDevice);

                        }
                        i++;
                        if (lastDevId == sensorId) {
                            hubResponse.data = { liveDataCountPerDeviceId: listResult };
                            response = hubResponse.getOkResponse();

                            res.end(response);
                        }
                        else {
                            sensorManager[funcName](listDevIds[i], timeStart, timeEnd, fetchSensor);
                        }
                    };

                    sensorManager[funcName](listDevIds[i], timeStart, timeEnd, fetchSensor);
                    

                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
                }
            }
        });
            }
    )
        
    

    var getLiveDataCount = function (req, res, isLogicalDeviceId) {

        var hubResponse = new responseModule.HubResponse();
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else {

                if (req.query != null && req.query.deviceIds != null) {


                    var timeStart = req.query.timeStart;
                    var timeEnd = req.query.timeEnd;
                    var listDevIds = req.query.deviceIds.split(',');

                    var listResult = [];
                    var lastDevId = listDevIds[listDevIds.length - 1];
                    console.log('getting data', listDevIds);
                    var i = 0;

                    var funcName = 'getLiveDataCount';

                    if (!isLogicalDeviceId)
                        funcName = 'getLiveDataCountFromDeviceId';

                    

                    var fetchSensor = function (err, sensorId, value) {
                        if (err == null) {
                            var resultPerDevice = { deviceId: sensorId, count: value };
                            listResult.push(resultPerDevice);

                        }
                        i++;
                        if (lastDevId == sensorId) {
                            hubResponse.data = { liveDataCountPerDeviceId: listResult };
                            response = hubResponse.getOkResponse();

                            res.end(response);
                        }
                        else {
                            sensorManager[funcName](listDevIds[i], timeStart, timeEnd, fetchSensor);
                        }
                    };

                    sensorManager[funcName](listDevIds[i], timeStart, timeEnd, fetchSensor);
                    

                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
                }
            }
        });

    }

    express.get('/device/sensor/livedata/count', function (req, res) {
        console.log('getting live data count for sensor');
        getLiveDataCount(req, res, true);
        
    });

    express.get('/device/sensor/livedata/v1', function (req, res) {
       // getLiveData(req, res, false);
       express.use(apiLimiter);
        var hubResponse = new responseModule.HubResponse();

        thirdpartyrequestValidation.isValidThirdPartyuser(req.query.apikey, function(result){
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else {

                if (req.query != null && req.query.deviceIds != null) {
                    console.log('getting data', listDevIds);
                    var timeStart = req.query.timeStart;
                    var timeEnd = req.query.timeEnd;
                    var listDevIds = req.query.deviceIds.split(',');
                    var listResult = [];
                    var lastDevId = listDevIds[listDevIds.length - 1];
                    var i = 0;
                    var numberOfRecords = 10;
                    var offset = 0;
                    if (req.query.limit != null)
                        numberOfRecords = parseInt(req.query.limit);
                    if (req.query.offset != null)
                        offset = parseInt(req.query.offset);

                    var fetchSensorLiveData = function () {
                        
                            sensorManager.getLiveDataFromDeviceId(listDevIds[i], numberOfRecords, offset, timeStart, timeEnd, fetchSensor);

                    };

                    var fetchSensor = function (err, sensorId, value) {
                        if (err == null) {
                            var resultPerDevice = { deviceId: listDevIds[i], dataList: value };
                            listResult.push(resultPerDevice);

                        }
                        i++;
                        if (i >= listDevIds.length) {
                            hubResponse.data = { liveDataPerDeviceId: listResult };
                            response = hubResponse.getOkResponse();
    
                            res.end(response);
                        }
                        else {
                            fetchSensorLiveData();
                            //sensorManager.getLiveData(listDevIds[i], numberOfRecords, offset, timeStart, timeEnd, fetchSensor);
                        }
                    };

                    fetchSensorLiveData();
                    //sensorManager.getLiveData(listDevIds[i], numberOfRecords, offset, timeStart, timeEnd, fetchSensor);
    

                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
                }
            }
        });


    

    });

    var getLiveData = function (req, res, isLogicalDeviceId) {

        var hubResponse = new responseModule.HubResponse();

        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);
            }
            else {

                if (req.query != null && req.query.deviceIds != null) {
                    console.log('getting data', listDevIds);
                    var timeStart = req.query.timeStart;
                    var timeEnd = req.query.timeEnd;
                    var listDevIds = req.query.deviceIds.split(',');
                    var listResult = [];
                    var lastDevId = listDevIds[listDevIds.length - 1];
                    var i = 0;
                    var numberOfRecords = 10;
                    var offset = 0;
                    if (req.query.limit != null)
                        numberOfRecords = parseInt(req.query.limit);
                    if (req.query.offset != null)
                        offset = parseInt(req.query.offset);

                    var fetchSensorLiveData = function () {
                        if(isLogicalDeviceId)
                            sensorManager.getLiveData(listDevIds[i], numberOfRecords, offset, timeStart, timeEnd, fetchSensor);
                        else
                            sensorManager.getLiveDataFromDeviceId(listDevIds[i], numberOfRecords, offset, timeStart, timeEnd, fetchSensor);

                    };

                    var fetchSensor = function (err, sensorId, value) {
                        if (err == null) {
                            var resultPerDevice = { deviceId: listDevIds[i], dataList: value };
                            listResult.push(resultPerDevice);

                        }
                        i++;
                        if (i >= listDevIds.length) {
                            hubResponse.data = { liveDataPerDeviceId: listResult };
                            response = hubResponse.getOkResponse();
    
                            res.end(response);
                        }
                        else {
                            fetchSensorLiveData();
                            //sensorManager.getLiveData(listDevIds[i], numberOfRecords, offset, timeStart, timeEnd, fetchSensor);
                        }
                    };

                    fetchSensorLiveData();
                    //sensorManager.getLiveData(listDevIds[i], numberOfRecords, offset, timeStart, timeEnd, fetchSensor);
    

                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
                }
            }
        });


    }

    express.get('/device/sensor/livedata', function (req, res) {
        console.log('getting live data for sensor11');

        getLiveData(req, res, true);
       

    });


    express.post('/device/sensor/livedata', function (req, res) {
        console.log('updating live data for sensor');

		
        var hubResponse = new responseModule.HubResponse();
        
        if (req.body != null)
        {
            var panicDataServer = function(body){

                var json = req.body;
                var pUrl = config.PanicSettings.panUrl;
                var options = {
                    url: 'pUrl',
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    url: pUrl,
                    json: json
                  };
            
                  request(options, function(err, res, bod) {
                    if (res && (res.statusCode === 200 || res.statusCode === 201)) {
                      console.log(bod);
                    }
                  });
               
            }
            
            sensorManager.pushSensorData(req.body.deviceId, req.body.data, function (err)
            {
                //panicDataServer(req.body);

                if (err == null)
                {
                    response = hubResponse.getOkResponse();
                    
                }
                else
                    response = hubResponse.getErrorResponse(-2, "Failed to update DB in server");


                res.end(response);
            });
        }
        else
        {
            res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
        }
    });


    var convertFromOldToNewFormat = function (oldJsonData) {
        var result = null;

        if (oldJsonData.deviceId != null && oldJsonData.payload != null && oldJsonData.payload.d != null) {
            var newData = oldJsonData.payload.d;
            if (newData.deviceId != null)
                delete newData.deviceId;

            if (newData.deviceType != null)
                delete newData.deviceType;

            if (newData.uptime != null)
                delete newData.uptime;

            result = { deviceId: oldJsonData.deviceId, data: newData };
        }
        return result;
    }
    express.post('/device/sensor/livedata/oldformat', function (req, res) {
        console.log('updating live data for sensor');

        var hubResponse = new responseModule.HubResponse();
        
        if (req.body != null) {
            var newFormat = convertFromOldToNewFormat(req.body);
            if (newFormat != null) {
                sensorManager.pushSensorData(newFormat.deviceId, newFormat.data, function (err) {
                    if (err != null) {
                        response = hubResponse.getOkResponse();
                        res.end(response);
                    }

                });
            }
            else
                res.end(hubResponse.getErrorResponse(-2, "Invalid Format"));
        }
        else {
            res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
        }
        


    });

    var includeDailyStats = function (optionList) {
        return optionList.indexOf('daily') >= 0;
    };
    var includeMonthlyStats = function (optionList) {
        return optionList.indexOf('monthly') >= 0;
    };
    var includeYearlyStats = function (optionList) {
        return optionList.indexOf('yearly') >= 0;
    };


    
    express.get('/device/sensor/stats/v1', function (req, res)
    {
        //console.log('getting live data for sensor11');
        express.use(apiLimiter);

        var hubResponse = new responseModule.HubResponse();

        thirdpartyrequestValidation.isValidThirdPartyuser(req.query.apikey, function(result){
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else
            {
                //console.log("param-->", req.query.params);
                if (req.query != null && req.query.deviceIds != null  && req.query.timeFrame!= null)
                {
                    var options = req.query.timeFrame.split(',');
                    var timeStart = req.query.timeStart;
                    var timeEnd = req.query.timeEnd;
                    var listDevIds = req.query.deviceIds.split(',');
                    var paramList = null;//req.query.params.split(',');
                    if (req.query.params != null)
                        paramList = req.query.params.split(',');

                    var listResult = [];
                    var lastDevId = listDevIds[listDevIds.length - 1];
                    var i = 0;
                    var numberOfRecords = 100;
                    var offset = 0;



                    if (req.query.limit != null)
                        numberOfRecords = parseInt(req.query.limit);
                    if (req.query.offset != null)
                        offset = parseInt(req.query.offset);

                    {
                        var devId = listDevIds[i];

                        var fetchSensor = function (err, value)
                        {
                            if (err == null)
                            {
                                var resultPerDevice = { deviceId: listDevIds[i], stat: value };
                                listResult.push(resultPerDevice);
                                

                            }
                            i++;
                            if (i >= listDevIds.length) {
                                
                                hubResponse.data = { statPerDeviceId: listResult };
                                response = hubResponse.getOkResponse();

                                res.end(response);
                            }
                            else
                            {
                                sensorManager.getSensorStats(listDevIds[i], paramList, timeStart, timeEnd, includeDailyStats(options), includeMonthlyStats
                                  (options), includeYearlyStats(options),numberOfRecords,offset, fetchSensor);
                            }
                        };
                        sensorManager.getSensorStats(listDevIds[i], paramList, timeStart, timeEnd, includeDailyStats(options), includeMonthlyStats
                                    (options), includeYearlyStats(options), numberOfRecords, offset, fetchSensor);
                    }

                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
                }
            }
        });

    });
    
    express.get('/device/sensor/stats', function (req, res)
    {
        console.log('getting live data for sensor11');

        var hubResponse = new responseModule.HubResponse();

        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result)
        {
            if (result == null)
            {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);
            }
            else
            {
                //console.log("param-->", req.query.params);
                if (req.query != null && req.query.deviceIds != null  && req.query.timeFrame!= null)
                {
                    var options = req.query.timeFrame.split(',');
                    var timeStart = req.query.timeStart;
                    var timeEnd = req.query.timeEnd;
                    var listDevIds = req.query.deviceIds.split(',');
                    var paramList = null;//req.query.params.split(',');
                    if (req.query.params != null)
                        paramList = req.query.params.split(',');

                    var listResult = [];
                    var lastDevId = listDevIds[listDevIds.length - 1];
                    var i = 0;
                    var numberOfRecords = 100;
                    var offset = 0;



                    if (req.query.limit != null)
                        numberOfRecords = parseInt(req.query.limit);
                    if (req.query.offset != null)
                        offset = parseInt(req.query.offset);

                    {
                        var devId = listDevIds[i];

                        var fetchSensor = function (err, value)
                        {
                            if (err == null)
                            {
                                var resultPerDevice = { deviceId: listDevIds[i], stat: value };
                                listResult.push(resultPerDevice);
                                

                            }
                            i++;
                            if (i >= listDevIds.length) {
                                
                                hubResponse.data = { statPerDeviceId: listResult };
                                response = hubResponse.getOkResponse();

                                res.end(response);
                            }
                            else
                            {
                                sensorManager.getSensorStats(listDevIds[i], paramList, timeStart, timeEnd, includeDailyStats(options), includeMonthlyStats
                                  (options), includeYearlyStats(options),numberOfRecords,offset, fetchSensor);
                            }
                        };
                        sensorManager.getSensorStats(listDevIds[i], paramList, timeStart, timeEnd, includeDailyStats(options), includeMonthlyStats
                                    (options), includeYearlyStats(options), numberOfRecords, offset, fetchSensor);
                    }

                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
                }
            }
        });

    });


    express.get('/device/sensor/stats/v1/count', function (req, res)
    {
        express.use(apiLimiter);
        var hubResponse = new responseModule.HubResponse();

        thirdpartyrequestValidation.isValidThirdPartyuser(req.query.apikey, function(result){
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else {

                if (req.query.params == null)
                    req.query.params = null;
                if (req.query != null && req.query.deviceIds != null &&  req.query.timeFrame != null)
                {
                    var options = req.query.timeFrame.split(',');
                    var timeStart = req.query.timeStart;
                    var timeEnd = req.query.timeEnd;
                    var listDevIds = req.query.deviceIds.split(',');
                    var paramList = null;
                    if (req.query.params!= null)
                        paramList = req.query.params.split(',');
                    var listResult = [];
                    var lastDevId = listDevIds[listDevIds.length - 1];
                    var i = 0;
                    var numberOfRecords = 10;
                    var offset = 0;

                    if (req.query.limit != null)
                        numberOfRecords = parseInt(req.query.limit);
                    if (req.query.offset != null)
                        offset = parseInt(req.query.offset);

                    {
                        var devId = listDevIds[i];

                        var fetchSensor = function (err, value)
                        {
                            if (err == null) {
                                var resultPerDevice = { deviceId: listDevIds[i], stat: value };
                                listResult.push(resultPerDevice);


                            }
                            i++;
                            if (i >= listDevIds.length) {

                                hubResponse.data = { statCountPerDeviceId: listResult };
                                response = hubResponse.getOkResponse();

                                res.end(response);
                            }
                            else {
                                sensorManager.getSensorStatsCount(listDevIds[i], paramList, timeStart, timeEnd, includeDailyStats(options), includeMonthlyStats
                                  (options), includeYearlyStats(options), fetchSensor);
                            }
                        };
                        sensorManager.getSensorStatsCount(listDevIds[i], paramList, timeStart, timeEnd, includeDailyStats(options), includeMonthlyStats
                                    (options), includeYearlyStats(options), fetchSensor);
                    }

                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
                }
            }
        });

    });


    express.get('/device/sensor/stats/count', function (req, res)
    {

        var hubResponse = new responseModule.HubResponse();

        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);
            }
            else {

                if (req.query.params == null)
                    req.query.params = null;
                if (req.query != null && req.query.deviceIds != null &&  req.query.timeFrame != null)
                {
                    var options = req.query.timeFrame.split(',');
                    var timeStart = req.query.timeStart;
                    var timeEnd = req.query.timeEnd;
                    var listDevIds = req.query.deviceIds.split(',');
                    var paramList = null;
                    if (req.query.params!= null)
                        paramList = req.query.params.split(',');
                    var listResult = [];
                    var lastDevId = listDevIds[listDevIds.length - 1];
                    var i = 0;
                    var numberOfRecords = 10;
                    var offset = 0;

                    if (req.query.limit != null)
                        numberOfRecords = parseInt(req.query.limit);
                    if (req.query.offset != null)
                        offset = parseInt(req.query.offset);

                    {
                        var devId = listDevIds[i];

                        var fetchSensor = function (err, value)
                        {
                            if (err == null) {
                                var resultPerDevice = { deviceId: listDevIds[i], stat: value };
                                listResult.push(resultPerDevice);


                            }
                            i++;
                            if (i >= listDevIds.length) {

                                hubResponse.data = { statCountPerDeviceId: listResult };
                                response = hubResponse.getOkResponse();

                                res.end(response);
                            }
                            else {
                                sensorManager.getSensorStatsCount(listDevIds[i], paramList, timeStart, timeEnd, includeDailyStats(options), includeMonthlyStats
                                  (options), includeYearlyStats(options), fetchSensor);
                            }
                        };
                        sensorManager.getSensorStatsCount(listDevIds[i], paramList, timeStart, timeEnd, includeDailyStats(options), includeMonthlyStats
                                    (options), includeYearlyStats(options), fetchSensor);
                    }

                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
                }
            }
        });

    });


}

// export the class
module.exports =
 {
     SensorApi
 };
