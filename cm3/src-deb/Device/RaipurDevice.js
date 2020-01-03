var DeviceModule = require('./Device.js');
var AfmSensorDeviceModule = require('./AfmSensorDevice.js');

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


function RaipurDevice() {
    this.getDefaultParamDefinitions = function () {

        var temp = this.parent.getDefaultParamDefinitions.call(this);
        var newParamList = [
            
/*
                     {
                        filteringMethod: null,
                        filteringMethodDef: null,
                        paramName: "AsH3",
                        maxRanges: {
                            min: 0,
                            max: 100
                        },
                    },

                    {
                        filteringMethod: null,
                        filteringMethodDef: null,
                        paramName: "C6H6",
                        maxRanges: {
                            min: 0,
                            max: 100
                        },
                    },
*/            
                     {
                                     filteringMethod: null,
                                     filteringMethodDef: null,
                                    paramName: "latitude",
                                 },
                                 {
                                     filteringMethod: null,
                                     filteringMethodDef: null,
                                     paramName: "longitude",
                                 }
                                 
        ];

        for (var i = 0; i < newParamList.length; i++) {
            temp.push(newParamList[i]);
        }
        return temp;
    }
}

RaipurDevice.prototype = new AfmSensorDeviceModule.AfmSensorDevice();
RaipurDevice.prototype.constructor = RaipurDevice;
RaipurDevice.prototype.parent = AfmSensorDeviceModule.AfmSensorDevice.prototype;


// export the class
module.exports =
{
    RaipurDevice
};
