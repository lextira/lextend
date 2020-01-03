
var DeviceModule = require('./Device.js');
var AfmSensorDeviceModule = require('./AfmSensorDevice.js');
var AfmSensorAClassDeviceModule = require('./AfmSensorAClassDevice.js');
var RaipurDeviceModule = require('./RaipurDevice.js');
var PanicButtonDeviceModule = require('./PanicButtonDevice.js');


function DeviceFactory() {

    this.createDeviceInstanceFromSubType = function (subType) {
        var result = null;
        if (subType == "AFMEthernet") {
            result = new AfmSensorDeviceModule.AfmSensorDevice();
        }
        else if (subType == "EnvSensorDevice") {
            result = new AfmSensorAClassDeviceModule.AfmSensorAClassDevice();
            
        }
        else if (subType == "RaipurDevice") {
            result = new RaipurDeviceModule.RaipurDevice();
        }
        else if (subType == "PanicButtonDevice") {
            result = new PanicButtonDeviceModule.PanicButtonDevice();
        }
        
        

        else {
            result = new DeviceModule.Device();

        }

        return result;

    }
    
}


// export the class
module.exports =
 {
     DeviceFactory
 };
