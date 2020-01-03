var DeviceModule = require('./Device.js');

var UnitConverterModule = require('../Utils/UnitConverter.js');
var unitConverter = new UnitConverterModule.UnitConverter();

var StatisticsManagerModule = require('../Calc/StatisticsManager.js');
var statManager = new StatisticsManagerModule.StatisticsManager();

var WMAFilteringModule = require('../Utils/WMAFiltering.js');
var filteringWMA = new WMAFilteringModule.WMAFiltering();

var SensorLiveDataHandlerModule = require('../Device/SensorLiveDataHandler.js')
var sensorLiveDataHandler = new SensorLiveDataHandlerModule.SensorLiveDataHandler();

var GenUtilsModule = require('../Utils/GenUtils.js');
var genUtils = new GenUtilsModule.GenUtils();


function AfmSensorDevice() {

    this.paramDefinitions = null;

    this.parse = function (jsonObject) {
        this.parent.parse.call(this, jsonObject);
        this.paramDefinitions = this.getDefaultParamDefinitions();
        if (jsonObject.paramDefinitions != null){

            for (var i = 0; i < this.paramDefinitions.length; i++) {

                for(var j=0; j < jsonObject.paramDefinitions.length;j++)
                {
                    if (this.paramDefinitions[i].paramName == jsonObject.paramDefinitions[j].paramName) {

                        this.paramDefinitions[i].filteringMethod = jsonObject.paramDefinitions[j].filteringMethod;
                        this.paramDefinitions[i].filteringMethodDef = jsonObject.paramDefinitions[j].filteringMethodDef;
                        this.paramDefinitions[i].maxRanges = jsonObject.paramDefinitions[j].maxRanges;
                        if (this.paramDefinitions[i].maxRanges != null) {

                            if (this.paramDefinitions[i].maxRanges.min != null && !genUtils.isNumber(this.paramDefinitions[i].maxRanges.min))
                            {
                                this.paramDefinitions[i].maxRanges.min = null;
                            }
                            if (this.paramDefinitions[i].maxRanges.max != null && !genUtils.isNumber(this.paramDefinitions[i].maxRanges.max)) {
                                this.paramDefinitions[i].maxRanges.max = null;
                            }

                            if (this.paramDefinitions[i].maxRanges.max == null && this.paramDefinitions[i].maxRanges.min == null ) {
                                this.paramDefinitions[i].maxRanges = null;
                            }


                        }

                        this.paramDefinitions[i].calibration = jsonObject.paramDefinitions[j].calibration;

                        break;
                    }
                }
            }
        }
        
    }
    
    var processCalibration = function (val,paramDefItem) {
        console.log("processing calibaraton");
        if (paramDefItem.calibration != null) {
            if (paramDefItem.calibration.type == "curve") {
                for (var i = 0; i < paramDefItem.calibration.data.length; i++) {

                    var calibItem = paramDefItem.calibration.data[i];
                    if (val >= calibItem.min && val <= calibItem.max) {
                        //val += calibItem.offset;

                        if (calibItem.funct == null ||calibItem.funct == "translate" ){
                            val = val + calibItem.offset;

                        }
                        else if (calibItem.funct == "scale"){
                            val = val * calibItem.offset;

                        }
                        console.log("processing calibaraton",val);

                        break;

                    }
                }
            }
        }
        return val;
    }
    this.ProcessSensorData = function (currentData, callBack) {

        var filterResult = {}
        var paramDefs = this.paramDefinitions;
        var  i =0;
        var myInstance = this;
        var filterFunc = function () {

            console.log('FilterSensorData------------------------', paramDefs[i].paramName);

            filterResult[paramDefs[i].paramName] = currentData[paramDefs[i].paramName];

            // check if data is within limits, otherwise bound to limits.
            var boundValueToLimits = function (value) {
                if (paramDefs[i].maxRanges != null) {
                    if (paramDefs[i].maxRanges.max!= null && value > paramDefs[i].maxRanges.max) {
                        value = paramDefs[i].maxRanges.max;

                    }
                    if (paramDefs[i].maxRanges.min!= null && value < paramDefs[i].maxRanges.min) {
                        value = paramDefs[i].maxRanges.min;
                    }
                }
                return value;
            }
	    var originalVal = filterResult[paramDefs[i].paramName] ;
            filterResult[paramDefs[i].paramName] = processCalibration(boundValueToLimits(filterResult[paramDefs[i].paramName]), paramDefs[i]);

            if (paramDefs[i].filteringMethod == "WMAFilter" ) {

                sensorLiveDataHandler.getLiveData(myInstance.logicalDeviceId, 1, 0, null, null, function (err, sensorId, resultList) {
                    if (!err && resultList != null && resultList.length>0) {
                        var result = resultList[0];
                        if (result.data != null && result.data[paramDefs[i].paramName] != null) {

                            filteringWMA.parse(paramDefs[i].filteringMethodDef);
                            var oldValue = boundValueToLimits(result.data[paramDefs[i].paramName]);
                            var newValue =  processCalibration(originalVal, paramDefs[i]);;
                            console.log('filtering param', i, paramDefs[i].paramName, paramDefs[i].filteringMethodDef, result.data[paramDefs[i].paramName], newValue);

                            var res = filteringWMA.filter(oldValue, newValue);

                              filterResult[paramDefs[i].paramName] = boundValueToLimits(res);
//                            filterResult[paramDefs[i].paramName] = processCalibration(boundValueToLimits(res), paramDefs[i]);
                        }
                        
                    }

                    i++;
                    if (i < paramDefs.length) {
                        filterFunc();
                    }
                    else {
                        // insert AQI derived param.
                        filterResult.AQI = myInstance.findAQIFromLiveData(filterResult);
                        callBack(null, filterResult);
                    }
                });
            }
            else
            {
                i++;
                if (i < paramDefs.length) {
                    filterFunc();
                }
                else {
                    // insert AQI derived param.
                    filterResult.AQI = myInstance.findAQIFromLiveData(filterResult);
                    callBack(null, filterResult);
                }
            }
           
        }

        if (paramDefs != null && paramDefs.length > 0)
            filterFunc();
        else {
            callBack(1, null);
        }
    }
    this.isAQIApplicableForParamType = function (paramName) {

        paramName = paramName.toUpperCase();

        if (paramName == "PM2P5" || paramName == "PM10" || paramName == "SO2" || paramName == "NO2" ||
            paramName == "CO" || paramName == "O3" || paramName == "NH3" || paramName == "C6H6")
            return true;
//need to add AsH3
        return false;
            
    }

    // definition for weighted moving average
    this.getFiltringMethodWMADefinition = function () {

    }
    
    //to change the logic
    this.findAQIFromLiveData = function(currentData){

        var resAqi = -1;
        var statForPm2p5 = null;
        var statForPm10 = null;
        var count = 0;
        var aqiValue = -9999999999;

        var paramValueMap = {};

        for (paramName in currentData) {
            if (!this.isAQIApplicableForParamType(paramName))
                continue;

            var tempAvg = currentData[paramName];
            // get value ug /meter cube(m3)
            var ugPerM3 = unitConverter.convertPPMtoUgM3(paramName.toUpperCase(), tempAvg, null, null);

            var aqiVal = unitConverter.convertUgM3ToAqi(paramName.toUpperCase(), ugPerM3);
            console.log("AqI for param= ", paramName.toUpperCase(), "val:", aqiVal);
            paramValueMap[paramName.toUpperCase()] = aqiVal;
        }

        for (var pname in paramValueMap) {
            /*
            if (pname == "PM2P5")
                statForPm2p5 = paramValueMap[pname];

            if (pname == "PM10")
                statForPm10 = paramValueMap[pname];;
            */
           /* need to add C6H6 */

            if (pname == "PM2P5" || pname == "PM10" ||
                pname == "SO2" || pname == "NO2" || pname == "NH3" 
                || pname == "AsH3" || pname == "CO" || pname == "O3"
                ) {
                if (paramValueMap[pname] != null) {
                    count++;

                    aqiValue = Math.max(aqiValue, paramValueMap[pname]);
                    
                }
            }

        }
/*old code
        if (count >= 3 && (statForPm2p5 != null || statForPm10 != null)) {
            // enough parameter for aqi calc
            console.log("Aqi value------------->", aqiValue);
            resAqi = aqiValue;
        }

        return resAqi;
*/
if (count >= 1) {
    // enough parameter for aqi calc

    console.log("Aqi value------------->", aqiValue);
    resAqi = aqiValue;
}

return resAqi;
    }

    // This function updates any derived stats for the device.
    this.updateDerivedStats = function (dailyStats, collectionNamePrefix, date) {

        var statForPm2p5 = null;
        var statForPm10 = null;
        var count = 0;
        var aqiValue = -9999999999;

        var paramValueMap = {};

        for (var j = 0; j < dailyStats.length; j++) {
            if (!this.isAQIApplicableForParamType(dailyStats[j].paramName))
                continue;

            var tempAvg = dailyStats[j].statParams.sum / dailyStats[j].statParams.count;
            // get value ug /meter cube(m3)
            var ugPerM3 = unitConverter.convertPPMtoUgM3(dailyStats[j].paramName.toUpperCase(), tempAvg, null, null);

            var aqiVal = unitConverter.convertUgM3ToAqi(dailyStats[j].paramName.toUpperCase(), ugPerM3);
            console.log("AqI for param= ", dailyStats[j].paramName.toUpperCase(), "val:", aqiVal);
            paramValueMap[dailyStats[j].paramName.toUpperCase()] = aqiVal;
        }

        for (var pname in paramValueMap) {

            /*if (pname == "PM2P5")
                statForPm2p5 = paramValueMap[pname];

            if (pname == "PM10")
                statForPm10 = paramValueMap[pname];;

                need to add C6H6
*/

            if (pname == "PM2P5" || pname == "PM10" ||
                pname == "SO2" || pname == "NO2"
                    || pname == "CO" || pname == "O3"
                    || pname == "NH3"
                ) {
                count++;
                aqiValue = Math.max(aqiValue, paramValueMap[pname]);
            }

        }
/*
        if (count >=3  && (statForPm2p5 != null || statForPm10 != null)) {
            // enough parameter for aqi calc
            console.log("Aqi value------------->", aqiValue);
            statManager.updateDailyStats(collectionNamePrefix + "_daily", "AQI", aqiValue, date, this.timeZone, function (err) {
                // ignore error.
            });
        } */
        if (count >=1) {
            // enough parameter for aqi calc
            console.log("Aqi value------------->", aqiValue);
            statManager.updateDailyStats(collectionNamePrefix + "_daily", "AQI", aqiValue, date, this.timeZone, function (err) {
                // ignore error.
            });
        }
    }
    
}

AfmSensorDevice.prototype = new DeviceModule.Device();
AfmSensorDevice.prototype.constructor = AfmSensorDevice;
AfmSensorDevice.prototype.parent = DeviceModule.Device.prototype;


AfmSensorDevice.prototype.getDefaultParamDefinitions = function () {

    //PM2p5 PM10 temperature humidity presssure NO2 SO2  CO O3 noise uptime Validity CO2  radiation latitude longitude receivedTime
    var paramDefinitions = [
        {
            filteringMethod: filteringWMA.name,
            filteringMethodDef: filteringWMA.getParamDefClass(.8, .2),
            paramName: "temperature",
            displayName: "Temperature",
            displayNameHtml: "Temperature",
            unit: 'oC',
            unitDisplayHtml: '<sup>o</sup>C',
            isFilteringEnabled: false,
            isDisplayEnabled: true,
            displayImage: "temperature.png",
            isPrimary: false,
            needsLiveData: false,
            hasLimits: true,
            maxRanges: {
                min: -10,
                max: 50
            },
            limits: [
                {
                    max: 10,
                    color: "ffff00",
                    description: "Low"
                },
                {
                    min: 10,
                    max: 30,
                    color: "00ff00",
                    description: "Moderate"
                },
                 {
                     min: 30,
                     color: "ff0000",
                     description: "High"
                 }
            ]
        },
/*        {
            filteringMethod: filteringWMA.name,
            filteringMethodDef: filteringWMA.getParamDefClass(.8, .2),
            paramName: "rain",
            displayName: "Rain",
            displayNameHtml: "Rain",
            unit: 'mm',
            unitDisplayHtml: '<sup>o</sup>C',
            isFilteringEnabled: false,
            isDisplayEnabled: true,
            displayImage: "param.png",
            isPrimary: false,
            needsLiveData: false,
            hasLimits: true,
            maxRanges: {
                min: 0,
                max: 120000
            }
        },

        {
            filteringMethod: filteringWMA.name,
            filteringMethodDef: filteringWMA.getParamDefClass(.8, .2),
            paramName: "UVa",
            displayName: "UV.a",
            displayNameHtml: "UV.a",
            unit: 'mW/m2',
            unitDisplayHtml: '<sup>mW/m</sup>2',
            isFilteringEnabled: false,
            isDisplayEnabled: true,
            displayImage: "param.png",
            isPrimary: false,
            needsLiveData: false,
            hasLimits: true,
            maxRanges: {
                min: 0,
                max: 120000
            }
        },
        {
            filteringMethod: filteringWMA.name,
            filteringMethodDef: filteringWMA.getParamDefClass(.8, .2),
            paramName: "UVb",
            displayName: "UV.b",
            displayNameHtml: "UV.b",
            unit: 'mW/m2',
            unitDisplayHtml: '<sup>mW/m</sup>2',
            isFilteringEnabled: false,
            isDisplayEnabled: true,
            displayImage: "temperature.png",
            isPrimary: false,
            needsLiveData: false,
            hasLimits: true,
            maxRanges: {
                min: 0,
                max: 120000
            }
        },

        {
            filteringMethod: filteringWMA.name,
            filteringMethodDef: filteringWMA.getParamDefClass(.8, .2),
            paramName: "light",
            displayName: "Light",
            displayNameHtml: "Light",
            unit: 'lux',
            unitDisplayHtml: '<sup>lux</sup>',
            isFilteringEnabled: false,
            isDisplayEnabled: true,
            displayImage: "temperature.png",
            isPrimary: false,
            needsLiveData: false,
            hasLimits: true,
            maxRanges: {
                min: 0,
                max: 120000
            }
        },
*/
        {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "pressure",
            displayName: "Pressure",
            displayNameHtml: "Pressure",
            unit: 'hPa',
            unitDisplayHtml: 'hPa',
            displayImage: "pressure.png",
            isDisplayEnabled: true,
            needsLiveData: false,
            isPrimary: false,
            hasLimits: true,
            maxRanges: {
                min: 0,
                max: 100
            },
            limits: [
                {
                    max: 980,
                    color: "00B050",
                    description: "Low"
                },
                {
                    min: 980,
                    max: 1020,
                    color: "FFB9B3",
                    description: "Normal"
                },
                 {
                     min: 1020,
                     color: "FF0000",
                     description: "High"
                 }
           ]
       },
       /* {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "radiation",
            displayName: "Radiation",
            displayNameHtml: "Radiation",
            unit: 'uT/hr',
            unitDisplayHtml: '&mu;g/m<sup>3</sup>',
            displayImage: "radiation.png",
            isDisplayEnabled: true,
            needsLiveData: false,
            isPrimary: false,
            hasLimits: true,
            maxRanges: {
                min: 75,
                max: 900
            },
            limits: [
                {
                    max: 50,
                    color: "ffff00",
                    description: "Low"
                },
                {
                    min: 50,
                    max: 100,
                    color: "00ff00",
                    description: "Moderate"
                },
                 {
                     min: 100,
                     color: "ff0000",
                     description: "High"
                 }
            ]
        },*/
         {
             filteringMethod: null,
             filteringMethodDef: null,
             paramName: "humidity",
             displayName: "Humidity",
             displayNameHtml: "Humidity",
             unit: '%RH',
             unitDisplayHtml: '%RH',
             isDisplayEnabled: true,
             needsLiveData: false,
             isPrimary: false,
             displayImage: "humidity.png",
             hasLimits: true,
             maxRanges: {
                 min: 0,
                 max: 100
             },
             limits: [
                 {
                     max: 33,
                     color: "ffff00",
                     description: "Low"
                 },
                 {
                     min: 33,
                     max: 66,
                     color: "00ff00",
                     description: "Moderate"
                 },
                  {
                      min: 66,
                      color: "ff0000",
                      description: "High"
                  }
             ]
         },
         {
             filteringMethod: null,
             filteringMethodDef: null,
             paramName: "PM10",
             displayName: "PM10",
             displayNameHtml: "PM<sub>10</sub>",
             unit: 'ug/m3',
             unitDisplayHtml: '&mu;g/m<sup>3</sup>',
             isDisplayEnabled: true,
             needsLiveData: false,
             isPrimary: false,
             displayImage: "param.png",
             hasLimits: true,
             maxRanges: {
                 min: 00,
                 max: 500
             },
             limits: [
                 {
                     max: 100,
                     color: "ffff00",
                     description: "Low"
                 },
                 {
                     min: 100,
                     max: 250,
                     color: "00ff00",
                     description: "Moderate"
                 },
                  {
                      min: 250,
                      color: "ff0000",
                      description: "High"
                  }
             ]
         },
          {
              filteringMethod: null,
              filteringMethodDef: null,
              paramName: "PM2p5",
              displayName: "PM2P5",
              displayNameHtml: "PM<sub>2.5</sub>",
              unit: 'ug/m3',
              unitDisplayHtml: '&mu;g/m<sup>3</sup>',
              isDisplayEnabled: true,
              needsLiveData: false,
              isPrimary: false,
              displayImage: "param.png",
              hasLimits: true,
              maxRanges: {
                  min: 00,
                  max: 500
              },
              limits: [
                  {
                      max: 100,
                      color: "ffff00",
                      description: "Low"
                  },
                  {
                      min: 100,
                      max: 200,
                      color: "00ff00",
                      description: "Moderate"
                  },
                   {
                       min: 200,
                       color: "ff0000",
                       description: "High"
                   }
              ]
          },
          /*{
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "PM1",
            displayName: "PM1",
            displayNameHtml: "PM<sub>1</sub>",
            unit: 'ug/m3',
            unitDisplayHtml: '&mu;g/m<sup>3</sup>',
            isDisplayEnabled: true,
            needsLiveData: false,
            isPrimary: false,
            displayImage: "param.png",
            hasLimits: true,
            maxRanges: {
                min: 00,
                max: 1000
            },
            limits: [
                {
                    max: 100,
                    color: "ffff00",
                    description: "Low"
                },
                {
                    min: 100,
                    max: 200,
                    color: "00ff00",
                    description: "Moderate"
                },
                 {
                     min: 200,
                     color: "ff0000",
                     description: "High"
                 }
            ]
        },*/
          {
              filteringMethod: null,
              filteringMethodDef: null,
              paramName: "CO",
              displayName: "CO",
              displayNameHtml: "CO",
              unit: 'PPM',
              unitDisplayHtml: 'PPM',
              displayImage: "param.png",
              isFilteringEnabled: false,
              needsLiveData: true,
              isPrimary: false,
              filteringMethod: null,
              isDisplayEnabled: true,
              hasLimits: true,
              maxRanges: {
                  min: 00,
                  max: 1000
              },
              limits: [
                  {
                      max: 0.4,
                      color: "ffff00",
                      description: "Low"
                  },
                  {
                      min: 0.4,
                      max: 1.0,
                      color: "00ff00",
                      description: "Moderate"
                  },
                   {
                       min: 1.0,
                       color: "ff0000",
                       description: "High"
                   }
              ]
          },
          
  /*         {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "AsH3",
            displayName: "AsH3",
            displayNameHtml: "AsH3",
            unit: 'PPM',
            unitDisplayHtml: 'PPM',
            displayImage: "param.png",
            isFilteringEnabled: false,
            needsLiveData: true,
            isPrimary: false,
            filteringMethod: null,
            isDisplayEnabled: true,
            hasLimits: true,
            maxRanges: {
                min: 00,
                max: 1
            },
            limits: [
                {
                    max: 0.4,
                    color: "ffff00",
                    description: "Low"
                },
                {
                    min: 0.4,
                    max: 1.0,
                    color: "00ff00",
                    description: "Moderate"
                },
                 {
                     min: 1.0,
                     color: "ff0000",
                     description: "High"
                 }
            ]
        },
        {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "C6H6",
            displayName: "C6H6",
            displayNameHtml: "C6H6",
            unit: 'PPM',
            unitDisplayHtml: 'PPM',
            displayImage: "param.png",
            isFilteringEnabled: false,
            needsLiveData: true,
            isPrimary: false,
            filteringMethod: null,
            isDisplayEnabled: true,
            hasLimits: true,
            maxRanges: {
                min: 00,
                max: 100
            },
            limits: [
                {
                    max: 0.00157,
                    color: "00B050",
                    description: "Good"
                },
                {
                    min: 0.00157,
                    max: 0.00313,
                    color: "92D050",
                    description: "Satisfactory"
                },
                  {
                      min: 0.00313,
                      max: 0.0047,
                      color: "FFB9B3",
                      description: "Moderate"
                  },
                  {
                      min: 0.0047,
                      max: 0.00626,
                      color: "FF9A00",
                      description: "Poor"
                  },
                  {
                      min: 0.00626,
                      max: 0.01565,
                      color: "FF0000",
                      description: "Very Poor"
                  },
                 {
                     min: 0.01565,
                     
                     color : "800000",
                     description: "Severe"
                 }
           ]
        },
        {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "NH3",
            displayName: "NH3",
            displayNameHtml: "NH3",
            unit: 'PPM',
            unitDisplayHtml: 'PPM',
            displayImage: "param.png",
            isFilteringEnabled: false,
            needsLiveData: true,
            isPrimary: false,
            filteringMethod: null,
            isDisplayEnabled: true,
            hasLimits: true,
            maxRanges: {
                min: 00,
                max: 500
            },
            limits: [
                {
                    max: 0.4,
                    color: "ffff00",
                    description: "Low"
                },
                {
                    min: 0.4,
                    max: 1.0,
                    color: "00ff00",
                    description: "Moderate"
                },
                 {
                     min: 1.0,
                     color: "ff0000",
                     description: "High"
                 }
            ]
        },

           {
               filteringMethod: null,
               filteringMethodDef: null,
               paramName: "O3",
               displayName: "O3",
               displayNameHtml: "O<sub>3</sub>",
               unit: "PPM",
               unitDisplayHtml: "PPM",
               needsLiveData: true,
               isDisplayEnabled: true,
               hasLimits: false,
               displayImage: "param.png",
               isPrimary: false,
               maxRanges: {
                   min: 00,
                   max: 2000
               },
               limits: [
                   {
                       max: 0.1,
                       color: "ffff00",
                       description: "Low"
                   },
                   {
                       min: 0.1,
                       max: 1.0,
                       color: "00ff00",
                       description: "Moderate"
                   },
                    {
                        min: 1.0,
                        color: "ff0000",
                        description: "High"
                    }
               ]

           },
*/
         {
             filteringMethod: null,
             filteringMethodDef: null,
             paramName: "NO2",
             displayName: "NO2",
             displayNameHtml: "NO<sub>2</sub>",
             unit: 'PPM',
             unitDisplayHtml: 'PPM',
             needsLiveData: true,
             displayImage: "param.png",
             isDisplayEnabled: true,
             isPrimary: false,
             hasLimits: true,
             maxRanges: {
                 min: 00,
                 max: 50
             },
             limits: [
                 {
                     max: 0.1,
                     color: "ffff00",
                     description: "Low"
                 },
                 {
                     min: 0.1,
                     max: 1.0,
                     color: "00ff00",
                     description: "Moderate"
                 },
                  {
                      min: 1.0,
                      color: "ff0000",
                      description: "High"
                  }
             ]
         },
         {
             filteringMethod: null,
             filteringMethodDef: null,
             paramName: "SO2",
             displayName: "SO2",
             displayNameHtml: "SO<sub>2</sub>",
             unit: 'PPM',
             unitDisplayHtml: 'PPM',
             displayImage: "param.png",
             needsLiveData: true,
             isDisplayEnabled: true,
             isPrimary: false,
             hasLimits: true,
             maxRanges: {
                 min: 00,
                 max: 50
             },
             limits: [
                 {
                     max: 0.4,
                     color: "ffff00",
                     description: "Low"
                 },
                 {
                     min: 0.4,
                     max: 1.0,
                     color: "00ff00",
                     description: "Moderate"
                 },
                  {
                      min: 1.0,
                      color: "ff0000",
                      description: "High"
                  }
             ]
         },
         {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "CO2",
            displayName: "CO2",
            displayNameHtml: "CO<sub>2</sub>",
            unit: 'PPM',
            unitDisplayHtml: 'PPM',
            displayImage: "param.png",
            needsLiveData: true,
            isDisplayEnabled: true,
            isPrimary: false,
            hasLimits: true,
            maxRanges: {
                min: 00,
                max: 5000
            },
            limits: [
                {
                    max: 500,
                    color: "ffff00",
                    description: "Low"
                },
                {
                    min: 500,
                    max: 1000,
                    color: "00ff00",
                    description: "Moderate"
                },
                 {
                     min: 1000,
                     color: "ff0000",
                     description: "High"
                 }
            ]
        },
  /*       {
             filteringMethod: null,
             filteringMethodDef: null,
             paramName: "noise",
             displayName: "Noise",
             displayNameHtml: "Noise",
             unit: "dB",
             unitDisplayHtml: "dB",
             displayImage: "param.png",
             needsLiveData: false,
             isDisplayEnabled: true,
             isPrimary: false,
             hasLimits: false,
             maxRanges: {
                 min: 00,
                 max: 60
             },
         },
*/
         {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "panic",
            displayName: "Panic",
            displayNameHtml: "Panic",
            unit: "",
            unitDisplayHtml: "",
            displayImage: "param.png",
            needsLiveData: false,
            isDisplayEnabled: true,
            isPrimary: false,
            hasLimits: false,
            maxRanges: {
                min: 00,
                max: 1
            },
        },
        {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "uptime",
            displayName: "Up-Time",
            displayNameHtml: "Up-Time",
            unit: 's',
            unitDisplayHtml: 's',
            displayImage: "param.png",
            needsLiveData: false,
            isDisplayEnabled: false,
            isPrimary: false,
            hasLimits: false
        },
        

        {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "receivedTime",
            displayName: "Received Time",
            displayNameHtml: "Received Time",
            //unit : "hms",
            unit: '',
            unitDisplayHtml: '',
            
            displayImage: "param.png",
            needsLiveData: false,
            isDisplayEnabled: true,
            isPrimary: false,
            hasLimits: false
        },
        {
            filteringMethod: null,
            filteringMethodDef: null,
            paramName: "AQI",
            displayName: "AQI",
            displayNameHtml: "AQI",
            unit: '',
            unitDisplayHtml: '',
            displayImage: "param.png",
            needsLiveData: false,
            isDisplayEnabled: true,
            isPrimary: true,
            hasLimits: true,
            maxRanges: {
                min: 00,
                max: 500
            },
            limits: [
                {
                    max: 51,
                    color: "00B050",
                    description: "Good"
                },
                {
                    min: 51,
                    max: 101,
                    color: "92D050",
                    description: "Satisfactory"
                },
                  {
                      min: 101,
                      max: 201,
                      color: "FFFF00",
                      description: "Moderate"
                  },
                  {
                      min: 201,
                      max: 301,
                      color: "FF9A00",
                      description: "Poor"
                  },
                  {
                      min: 301,
                      max: 401,
                      color: "FF0000",
                      description: "Very Poor"
                  },
                 {
                     min: 401,
                     
                     color: "C00000",
                     description: "Severe"
                 }
            ]
        }
    ]

    return paramDefinitions;
}

// export the class
module.exports =
{
     AfmSensorDevice
};
