var deviceModule = require('./Device.js');

var DatabaseHandlerModule = require('../DatabaseHandler.js');
var dbInstance = new  DatabaseHandlerModule.DatabaseHandler();

var DeviceManagerModule = require('../Device/DeviceManager.js');
var deviceManager = new DeviceManagerModule.DeviceManager();

var StatisticsManagerModule = require('../Calc/StatisticsManager.js');
var statManager = new StatisticsManagerModule.StatisticsManager();

var DateUtilsModule = require('../Utils/DateUtils.js');
var dateUtils = new DateUtilsModule.DateUtils();


var DeviceFactoryModule = require('./DeviceFactory.js');
var devFactory = new DeviceFactoryModule.DeviceFactory();
var fs=require("fs")

var UnitConverterModule = require('../Utils/UnitConverter.js');
var unitConverter = new UnitConverterModule.UnitConverter();

var SensorLiveDataHandlerModule = require('../Device/SensorLiveDataHandler.js')
var sensorLiveDataHandler = new SensorLiveDataHandlerModule.SensorLiveDataHandler();
var request=require('request');
var config = require('../ServerSettings');

function SensorManager()
{
    var myInstance = this;
	
	this.incomingDataQueue = [];
   
    
    this.getReceivedTimeQueryJson = function (timeStart, timeEnd)
    {
        var res = null;
        if (timeStart != null && timeEnd != null) {
            res = [
                               { "data.receivedTime": { $gte: parseInt(timeStart) } },
                               { "data.receivedTime": { $lte: parseInt(timeEnd) } }
            ]
        }
        else if(timeStart!= null)
        {
            res = [
                               { "data.receivedTime": { $gte: parseInt(timeStart) } }
            ]
        }
        else if (timeEnd!= null) {
            res = [
                               { "data.receivedTime": { $lte: parseInt(timeEnd) } }
            ]
        }

        return res;

    }


    this.getLiveDataFromDeviceId = function (sensorId, limit, offset, timeStart, timeEnd, callBack) {

        deviceManager.getDeviceFromId(sensorId, function (device) {

            if (device != null) {
                sensorLiveDataHandler.getLiveData(device.logicalDeviceId, limit, offset, timeStart, timeEnd, function (err, sensorIdLogical, value) {
                    callBack(err, sensorId, value);
                });

            }
            else
                callBack(1, sensorId, null);
        });

        

    };


    // timeStart and timeEnd are nunmbers (for epoch values).
    this.getLiveData = function (sensorIdLogical, limit,offset, timeStart,timeEnd,callBack)
    {
        //deviceManager.getDeviceFromId(sensorId, function (device) {

           // if (device!= null)
            {
                sensorLiveDataHandler.getLiveData(sensorIdLogical, limit, offset, timeStart, timeEnd, callBack);

            }

    };


    this.getLiveDataCountFromDeviceId = function (deviceId, timeStart, timeEnd, callBack) {
       
        var myInstance = this;

         deviceManager.getDeviceFromId(deviceId, function (device) {
             if (device != null)
             {
                 var logicalSensorId = device.logicalDeviceId;
                var collectionName = logicalSensorId;
                var timeCond = myInstance.getReceivedTimeQueryJson(timeStart, timeEnd);

                var deviceQuery =
                {
                    logicalDeviceId: logicalSensorId,
                    $and: myInstance.getReceivedTimeQueryJson(timeStart, timeEnd)
                };
                if (timeCond == null) {
                    delete deviceQuery.$and;
                }

                console.log("sensor id.....", logicalSensorId);
                var excludeFields = { '_id': false, 'deviceId': false };

                dbInstance.getDocumentCountByCriteria(collectionName, deviceQuery, function (err, result) {

                    if (err) {
                        callBack(1, deviceId, null);
                    }
                    else {
                        callBack(null, deviceId, result);
                    }

                });

                return;
                
             }
             else
                 callBack(1, deviceId, null);
        });

    };


    this.getLiveDataCount = function (logicalSensorId, timeStart, timeEnd, callBack) {

        var deviceId = logicalSensorId;
        var myInstance = this;
       // deviceManager.getDeviceFromId(deviceId, function (device) {
        // if (device != null)
        {
            //   if (device != null && device.devFamily) 
            {
                var collectionName = logicalSensorId;

                    var timeCond = myInstance.getReceivedTimeQueryJson(timeStart, timeEnd);

                    var deviceQuery =
       	            {
       	                logicalDeviceId: logicalSensorId,
       	                $and: myInstance.getReceivedTimeQueryJson(timeStart, timeEnd)
       	            };
                    if (timeCond == null) {
                        delete deviceQuery.$and;
                    }

                    console.log("sensor id.....", logicalSensorId);
                    var excludeFields = { '_id': false, 'deviceId': false };

                    dbInstance.getDocumentCountByCriteria(collectionName, deviceQuery,function (err, result) {

                        if (err) {
                            callBack(1, logicalSensorId, null);
                        }
                        else {
                            callBack(null, logicalSensorId, result);
                        }

                    });

                    return;
                }
            }
            callBack(1, logicalSensorId, null);
        //});

    };

    this.updateStatistics = function (date, collectionNamePrefix, dataObj,device,cb) {

		var paramNameList = [];
		for (var propFieldItem in dataObj)
		{
			paramNameList.push(propFieldItem);
		}
		
		var k = 0;
		var updateStatItem = function(){
		
			
			var propField = paramNameList[k];
			statManager.updateDailyStats(collectionNamePrefix+"_daily", propField, dataObj[propField], date, device.timeZone,function (err)
			{
				// ignore error.
				statManager.updateMonthlyStats(collectionNamePrefix + "_monthly", propField, dataObj[propField], date, device.timeZone,function (err)
				{
					// ignore error.
					statManager.updateYearlyStats(collectionNamePrefix + "_yearly", propField, dataObj[propField], date, device.timeZone, function (err)
					{
						// ignore error.
						k++;
						if (k < paramNameList.length)
						{
							
							updateStatItem();
						}
						else
						{
							cb();
						}
					});
			
				
				});
			
			});
				
		}
		
		if (k < paramNameList.length)
			updateStatItem();
		else
			cb();
        
    }


    this.updateDerivedParams = function (date, collectionNamePrefix, dataObj, device) {

        var specificDevice = devFactory.createDeviceInstanceFromSubType(device.subType);
        specificDevice.parse(device);

        if (device.subType == "AFMEthernet") {
            // AQI calculation is needed and is baed on daily statistics.

            var currentDate = dateUtils.convertDateToTimeZone(date, device.timeZone);

            this.getSensorStats(device.deviceId, null, currentDate.valueOf(), currentDate.valueOf(), true, false, false, 100, 0, function (err, res) {
                if (!err && res.dailyStat != null) {

                    specificDevice.updateDerivedStats(res.dailyStat, collectionNamePrefix, date);
                }
            });
        }
    }


    this.getSensorStats = function (deviceId, paramList, timeFrom, timeTo, includeDaily, includeMonthly, includeYearly, numberOfRecords, offset, callBack) {


        var result = {};

        var funcs = [];
        var funcsStatTimePeriodArg = [];
        if (includeDaily) {
            funcs.push(this.getSensorStatsInfo);
            funcsStatTimePeriodArg.push("_daily")
        }
        if (includeMonthly) {
            funcs.push(this.getSensorStatsInfo);
            funcsStatTimePeriodArg.push("_monthly")
        }
        if (includeYearly) {
            funcs.push(this.getSensorStatsInfo);
            funcsStatTimePeriodArg.push("_yearly")

        }
        var i = 0;
        if (funcs.length > 0)
        {
            var resCallBack = function (err, res) {

                if (!err)
                {
                    
                    if (funcsStatTimePeriodArg[i] == "_daily")
                        result.dailyStat = res;
                    if (funcsStatTimePeriodArg[i] == "_monthly")
                        result.monthlyStat = res;
                    if (funcsStatTimePeriodArg[i] == "_yearly")
                        result.yearlyStat = res;
                }

                i++;
                if (i < funcs.length)
                {
                    
                    funcs[i](deviceId, paramList, timeFrom, timeTo, numberOfRecords, offset,funcsStatTimePeriodArg[i], resCallBack);
                }
                else
                {
                    

                    callBack(null, result);
                }
            }

            funcs[i](deviceId, paramList, timeFrom, timeTo, numberOfRecords, offset, funcsStatTimePeriodArg[i],resCallBack);
        }

    }



    this.getSensorStatsCount = function (deviceId, paramList, timeFrom, timeTo, includeDaily, includeMonthly, includeYearly, callBack) {


        var result = {};

        var funcs = [];
        var funcsStatTimePeriodArg = [];
        if (includeDaily) {
            funcs.push(this.getSensorStatsInfoCount);
            funcsStatTimePeriodArg.push("_daily")
        }
        if (includeMonthly) {
            funcs.push(this.getSensorStatsInfoCount);
            funcsStatTimePeriodArg.push("_monthly")
        }
        if (includeYearly) {
            funcs.push(this.getSensorStatsInfoCount);
            funcsStatTimePeriodArg.push("_yearly")

        }
        var i = 0;
        if (funcs.length > 0) {
            var resCallBack = function (err, res) {

                if (!err) {

                    if (funcsStatTimePeriodArg[i] == "_daily")
                        result.dailyStat = res;
                    if (funcsStatTimePeriodArg[i] == "_monthly")
                        result.monthlyStat = res;
                    if (funcsStatTimePeriodArg[i] == "_yearly")
                        result.yearlyStat = res;
                }

                i++;
                if (i < funcs.length) {

                    funcs[i](deviceId, paramList, timeFrom, timeTo,  funcsStatTimePeriodArg[i], resCallBack);
                }
                else {


                    callBack(null, result);
                }
            }

            funcs[i](deviceId, paramList, timeFrom, timeTo,  funcsStatTimePeriodArg[i], resCallBack);
        }

    }


    this.getSensorStatsInfo = function (deviceId, paramList, timeFrom, timeTo, limit, offset,dbSuffix, callBack)
    {
       
        deviceManager.getDeviceFromId(deviceId, function (device)
        {
         
            if (device!=null)
            {
                var collectionName = myInstance.getStatCollectionPrefixFromDeviceLogicalId(device.logicalDeviceId) + dbSuffix;
                statManager.getStatParam(collectionName, paramList, timeFrom,timeTo,limit,offset,function (err, res)
                {

                    if (err)
                    {
                        callBack(1, null);
                    }
                    else {
                        callBack(null, res);
                    }

                });
            }
            else
                callBack(1, null);
        });
    }


    this.getSensorStatsInfoCount = function (deviceId, paramList, timeFrom, timeTo, dbSuffix, callBack) {

        deviceManager.getDeviceFromId(deviceId, function (device) {

            if (device != null) {
                var collectionName = myInstance.getStatCollectionPrefixFromDeviceLogicalId(device.logicalDeviceId) + dbSuffix;

                statManager.getStatParamCount(collectionName, paramList, timeFrom, timeTo, function (err, res) {

                    if (err) {
                        callBack(1, null);
                    }
                    else {
                        callBack(null, res);
                    }

                });
            }
            else
                callBack(1, null);
        });
    }

    this.getStatCollectionPrefixFromDeviceLogicalId = function (logicalId) {
    
        return logicalId + "_stat";
        
    }

    this.getRawDataCollectionName = function (logicalDeviceID) {

        return logicalDeviceID + "_raw";
    }

this.jsontrialfpush={};
this.jsontrialgeopush = {};


this.pushSensorData = function (sensorId,data1,callBack){
    
	
    this.incomingDataQueue.push( { sensorId : sensorId, data:data1, cb : callBack} );

}	
    this.processIncomingData = function ()
    {
		var myInstance = this;
		this.jsontrial;
		

	    var processFunc = function(){
          
		
			if (myInstance.incomingDataQueue.length <= 0 ){
				return setTimeout(processFunc,2000);
			}
				
			var processSingleItem = function(){
                
                
				var pushItem = myInstance.incomingDataQueue[0];
				myInstance.incomingDataQueue.splice(0,1);
				
				var sensorId = pushItem.sensorId;
				var deviceId = pushItem.sensorId;
                var data1 = pushItem.data;
                
				var callBack = pushItem.cb;
				
				var processNextItem = function(){
					if ( myInstance.incomingDataQueue.length > 0){
						processSingleItem();
					}
					else{
						return setTimeout(processFunc,2000);
					}
				}

				deviceManager.getDeviceFromId(deviceId, function (device)
				{
					if (device != null)
					{
						var specificDevice = devFactory.createDeviceInstanceFromSubType(device.subType);
						specificDevice.parse(device);

						if (device != null && device.logicalDeviceId!= null)
						{
							var collectionName = device.logicalDeviceId;
							//console.log("inserting sensor data to collection:", collectionName);

							// use time of server for this live data.
							var currentdate = new Date();
                            data1["receivedTime"] = currentdate.valueOf();
                            //when no lat and long not posted
                            //console.log("Location..",device.location);


                            var panicDataServerLoc = function(body){

                                var json = device.location;
                                var jsontrial={
                                    "NAME":null,
                                    "LOCATION":null
                                }
                                jsontrial["NAME"]=json["landMark"]
                                jsontrial["LOCATION"]="POINT"+"("+json["longitude"]+" " +json["latitude"]+")"
                                jsontrial=JSON.stringify(jsontrial);
                                jsontrialfpush=jsontrial;
                                
                                var jsongeo = {
                                    "LOCATION_NAME":null,
                                    "LON":null,
                                    "LAT":null
                                }
                                jsongeo["LOCATION_NAME"] = json["landMark"]
                                jsongeo["LON"] = json["longitude"]
                                jsongeo["LAT"] = json["latitude"]
                                jsongeo = JSON.stringify(jsongeo);
                                jsontrialgeopush = jsongeo;
                               
                            }

                            if (device.location != null ) {
                            panicDataServerLoc(device.location);
                                if ( (data1["latitude"] == null || data1["latitude"] == "") || (data1["longitude"] == null || data1["longitude"] == "" )   ){
                                            data1["latitude"] = device.location.latitude;
                                            data1["longitude"] = device.location.longitude;
                 
                                        }
                 
                                     }
                 

							
							specificDevice.ProcessSensorData(data1, function (ferr, filteredData) {

                                
                                var panicDataServer = function(body){
                                    
                                    var json = insetRowFiltered;
				    var moment = require('moment');

                                    timestamp = moment().format('YYYYMMDDHHmmss');
                                    
                                    var jsonpost={
                                        "NAME":null,
                                        "LOCATION":null,
                                        "DEVICE_ID":null,
                                        "PANIC":null
                                    }
                                   
                                    jsontrialfpush=JSON.parse(jsontrialfpush);
                                    jsonpost["NAME"]=jsontrialfpush["NAME"];
                                    jsonpost["LOCATION"]=jsontrialfpush["LOCATION"];
                                    jsonpost["DEVICE_ID"]=json["deviceId"];
                                    jsonpost["PANIC"]=json["data"]["panic"];

                                    var jsongeopost = {
					"ID":null,
                                        "APP_ID":null,
                                        "ALERT_DATETIME": null,
                                        "LON": null,
                                        "LAT": null,
                                        "LOCATION_NAME": null,
                                        "DEVICE_ID": null,
                                        "PANIC": null
                                    }
                                    jsontrialgeopush = JSON.parse(jsontrialgeopush);
				    jsongeopost["ID"] = json["deviceId"] + json["data"]["receivedTime"];
                                    jsongeopost["APP_ID"] = "Panic_Button";
                                    jsongeopost["ALERT_DATETIME"] = timestamp;
                                    jsongeopost["LON"] = jsontrialgeopush["LON"];
                                    jsongeopost["LAT"] = jsontrialgeopush["LAT"];
                                    jsongeopost["LOCATION_NAME"] = jsontrialgeopush["LOCATION_NAME"];
                                    jsongeopost["DEVICE_ID"] = json["deviceId"];
                                    jsongeopost["PANIC"] = json["data"]["panic"];


                                    if((jsonpost["PANIC"] =='0') || jsonpost["PANIC"] =='1' ){
                                 
                                    panicPost(jsonpost);
                                    var InputJSON = jsongeopost;
                                  
                                    var output = OBJtoXML(InputJSON);


                                    function OBJtoXML(obj) {
                                        var xml = '';
                                        for (var prop in obj) {
                                            xml += "<" + prop + ">";
                                            if(Array.isArray(obj[prop])) {
                                                for (var array of obj[prop]) {
                                    
                                                    xml += "</" + prop + ">";
                                                    xml += "<" + prop + ">";
                                    
                                                    xml += OBJtoXML(new Object(array));
                                                }
                                            } else if (typeof obj[prop] == "object") {
                                                xml += OBJtoXML(new Object(obj[prop]));
                                            } else {
                                                xml += obj[prop];
                                            }
                                            xml += "</" + prop + ">";
                                        }
                                        var xml = xml.replace(/<\/?[0-9]{1,}>/g,'');
                                       // console.log(xml);
                                        return xml;
                                    }
                                        
                                        geoCardPost(output);
                                    }
                                }

                                    var panicPost = function(jsonpost){
				    console.log("\n SOS PANIC \n");
				    console.log("--------------- \n");
				    const querystring = require('querystring');
                                    const https = require('https');
                                    var pHost = config.PanicPostSettings.panHost;
                                    var pPort = config.PanicPostSettings.panPort;
                                    var pPath = config.PanicPostSettings.panPath;
				
                                    var postData = JSON.stringify(jsonpost);
                                    var user = 'sysadmin';
                                    var password = 'ChangeM3N0w!';
                                    //var base64encodedData = new Buffer(user + ':' + password).toString('base64');
                                    var auth = 'Basic '+ Buffer.from(user + ':' + password).toString('base64');
                                    var options = {
                                    //hostname: '10.10.100.62',
                                    //port: 443,
                                    //path: '/ibm/ioc/api/data-injection-service/datablocks/76/dataitems',
                                      hostname: 'pHost',
                                      port:'pPort',
                                      path:'pPath',
                                      method: 'POST',
                                      headers: {
                                           'Content-Type': 'application/json',
                                           'Content-Length': postData.length,
                                           'Authorization': auth,
                                           'Access-Control-Allow-Origin': '*',
                                           'Ibm-Session-Id': '-'
                                         },
					hostname:pHost,
					port:pPort,
					path:pPath
                                    };
                                    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
                                    var req = https.request(options, (res) => {
                                      console.log('statusCode:', res.statusCode);
                                      //console.log('headers:', res.headers);
                                    
                                      res.on('data', (d) => {
                                        process.stdout.write(d);
                                      });
                                    });
                                    
                                    req.on('error', (e) => {
                                      console.error(e);
                                    });
                                    
                                    req.write(postData);
                                    req.end();           
                                }

                                var geoCardPost = function(jsongeopost){
		
					var dHost = config.Dial112PostSettings.dialHost;
					var dPort = config.Dial112PostSettings.dialPort;
					var dPath = config.Dial112PostSettings.dialPath;

					var postData = '<MSG>' + jsongeopost + '</MSG>';
					console.log("post",postData);
					const querystring = require('querystring');
                                    const http = require('http');
                                    var options = {
				    hostname: 'dHost',
				    port: 'dPort',
				    path: 'dPath',
                                    //hostname:'202.60.128.169',
				    //port:'80',
				    //path:'/RoltaGeoCADIntegrationWebService/api/PanicButton/SendPanicAlert',
                                     
                                      method: 'POST',
                                      headers: {
                                           'Content-Type': 'application/xml',
                                           'Content-Length': postData.length
                                         },
						hostname:dHost,
						port : dPort,
						path : dPath
					
                                    };
                                    //process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
                                    var req = http.request(options, (res) => {
                                      console.log('statusCode:', res.statusCode);
                                     // console.log('headers:', res.headers);
                                    
                                      res.on('data', (d) => {
                                        process.stdout.write(d);
                                      });
                                    });
                                    
                                    req.on('error', (e) => {
                                      console.error(e);
                                    });
                                    
                                    req.write(postData);
                                    req.end(); 

				                   
                                }

								if (filteredData != null) {

									var insetRowFiltered = {
										deviceId: sensorId,
										logicalDeviceId: device.logicalDeviceId,
										data: filteredData
                                    };
                                    //console.log("Data.....",insetRowFiltered);

                                    panicDataServer(insetRowFiltered);
                                    //panicGeoCard(insetRowFiltered);

									dbInstance.insertDocument(collectionName, insetRowFiltered);
									

									// update stat(based on filtered data) for this sensor params.
									var collectionNamePrefix = myInstance.getStatCollectionPrefixFromDeviceLogicalId(device.logicalDeviceId);
									myInstance.updateStatistics(currentdate, collectionNamePrefix,filteredData, device,function(){
									
										myInstance.updateDerivedParams(currentdate, collectionNamePrefix, filteredData, device);

										callBack(null);
										processNextItem();
									});
								}
								var insetRowRaw = {
									deviceId: sensorId,
									logicalDeviceId: device.logicalDeviceId,
									data: data1
								};


								dbInstance.insertDocument(myInstance.getRawDataCollectionName(device.logicalDeviceId), insetRowRaw);

							});
						   
						   
							return;
						}
					}
					callBack(1);
					processNextItem();
				});
			
			}
				
			var j = 0;
			if ( myInstance.incomingDataQueue.length > 0){
				processSingleItem();
			}
				
			
			
		}

		setTimeout(processFunc,2000);
    }
	
	this.processIncomingData();

    
}


// export the class
module.exports =
 {
     SensorManager
 };

