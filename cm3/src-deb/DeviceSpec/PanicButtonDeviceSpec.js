var DeviceSpecModule = require('./DeviceSpec.js');

function PanicButtonDeviceSpec() {

    this.id = "PanicButtonDevSpec";

    this.getParamDefinitions = function () {

        var paramDefinitions = [
           {
               paramName: "panic",
               displayName: "panic",
               displayNameHtml: "panic",
               unit: '',
               unitDisplayHtml: '',
               isDisplayEnabled: true,
               displayImage: "temperature.png",
               isPrimary: false, 
               needsLiveData: false, 
               valuePrecision: 0,
               maxRanges: {
                   min: 0,
                   max: 1
               },
               limits: [
                    {
                        max: 0,
                        color: "ffff00",
                        description: "Low"
                    },
                     {
                         min: 1,
                         color: "ff0000",
                         description: "High"
                     }
               ]
           },
           {
               filteringMethod: null,
               filteringMethodDef: null,
               paramName: "receivedTime",
               displayName: "Received Time",
               displayNameHtml: "Received Time",
               unit: '',
               unitDisplayHtml: '',
               displayImage: "param.png",
               needsLiveData: false,
               isDisplayEnabled: true,
               isPrimary: false,
               hasLimits: false
           }
        ];

        return paramDefinitions;
    }
    this.paramDefinitions = this.getParamDefinitions();

}

PanicButtonDeviceSpec.prototype = new DeviceSpecModule.DeviceSpec();
PanicButtonDeviceSpec.prototype.constructor = PanicButtonDeviceSpec;
PanicButtonDeviceSpec.prototype.parent = DeviceSpecModule.DeviceSpec.prototype;

module.exports =
{
    PanicButtonDeviceSpec
};


