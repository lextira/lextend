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


function PanicButtonDevice() {
    this.getDefaultParamDefinitions = function () {

        var temp = [];
        var newParamList = [

            {
                filteringMethod: null,
                filteringMethodDef: null,
                paramName: "panic",
                maxRanges: {
                    min: 0,
                    max: 1
                }
            },
            {
                filteringMethod: null,
                filteringMethodDef: null,
                paramName: "receivedTime",
            },
            

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

PanicButtonDevice.prototype = new AfmSensorDeviceModule.AfmSensorDevice();
PanicButtonDevice.prototype.constructor = PanicButtonDevice;
PanicButtonDevice.prototype.parent = AfmSensorDeviceModule.AfmSensorDevice.prototype;


// export the class
module.exports =
{
    PanicButtonDevice
};
