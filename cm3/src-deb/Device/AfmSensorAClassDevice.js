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


function AfmSensorAClassDevice() {
    this.getDefaultParamDefinitions = function () {

        var temp = this.parent.getDefaultParamDefinitions.call(this);
        var newParamList = [
            

           
             /* {
                  filteringMethod: null,
                  filteringMethodDef: null,
                  paramName: "altitude",
                  maxRanges: {
                      min: 0,
                      max: 100
                  },
              },
               {
                   filteringMethod: null,
                   filteringMethodDef: null,
                   paramName: "CO2_extra",
                   maxRanges: {
                       min: 0,
                       max: 100
                   },
               },
                 {
                     filteringMethod: null,
                     filteringMethodDef: null,
                     paramName: "PM1",
                     maxRanges: {
                         min: 0,
                         max: 100
                     },
                 },
                  {
                      filteringMethod: null,
                      filteringMethodDef: null,
                      paramName: "PM1_extra",
                      maxRanges: {
                          min: 0,
                          max: 100
                      },
                  },
                   {
                       filteringMethod: null,
                       filteringMethodDef: null,
                       paramName: "PM2p5_extra",
                       maxRanges: {
                           min: 0,
                           max: 100
                       },
                   },
                    {
                        filteringMethod: null,
                        filteringMethodDef: null,
                        paramName: "PM10_extra",
                        maxRanges: {
                            min: 0,
                            max: 100
                        },
                    },
                     {
                         filteringMethod: null,
                         filteringMethodDef: null,
                         paramName: "noise_extra",
                         maxRanges: {
                             min: 0,
                             max: 100
                         },
                     },

                     {
                         filteringMethod: null,
                         filteringMethodDef: null,
                         paramName: "UV",
                         maxRanges: {
                             min: 0,
                             max: 100
                         },
                     },

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

                     {
                         filteringMethod: null,
                         filteringMethodDef: null,
                         paramName: "UV_extra",
                         maxRanges: {
                             min: 0,
                             max: 100
                         },
                     },

                      {
                          filteringMethod: null,
                          filteringMethodDef: null,
                          paramName: "LUX",
                          maxRanges: {
                              min: 0,
                              max: 100
                          },
                      },
                       {
                           filteringMethod: null,
                           filteringMethodDef: null,
                           paramName: "LUX_extra",
                           maxRanges: {
                               min: 0,
                               max: 100
                           },
                       },

                        {
                            filteringMethod: null,
                            filteringMethodDef: null,
                            paramName: "SO2_WE",
                            maxRanges: {
                                min: 0,
                                max: 100
                            },
                        },
                         {
                             filteringMethod: null,
                             filteringMethodDef: null,
                             paramName: "SO2_AE",
                             maxRanges: {
                                 min: 0,
                                 max: 100
                             },
                         },
                          {
                              filteringMethod: null,
                              filteringMethodDef: null,
                              paramName: "NO2_WE",
                              maxRanges: {
                                  min: 0,
                                  max: 100
                              },
                          },

                          {
                              filteringMethod: null,
                              filteringMethodDef: null,
                              paramName: "NO2_AE",
                              maxRanges: {
                                  min: 0,
                                  max: 100
                              },
                          },

                           {
                               filteringMethod: null,
                               filteringMethodDef: null,
                               paramName: "CO_WE",
                               maxRanges: {
                                   min: 0,
                                   max: 100
                               },
                           },


                            {
                                filteringMethod: null,
                                filteringMethodDef: null,
                                paramName: "CO_AE",
                                maxRanges: {
                                    min: 0,
                                    max: 100
                                },
                            },
                             {
                                 filteringMethod: null,
                                 filteringMethodDef: null,
                                 paramName: "O3_WE",
                                 maxRanges: {
                                     min: 0,
                                     max: 100
                                 },
                             },

                               {
                                   filteringMethod: null,
                                   filteringMethodDef: null,
                                   paramName: "O3_AE",
                                   maxRanges: {
                                       min: 0,
                                       max: 100
                                   },
                               },
                                {
                                    filteringMethod: null,
                                    filteringMethodDef: null,
                                    paramName: "uptime_e4100",

                                },

                                {
                                    filteringMethod: null,
                                    filteringMethodDef: null,
                                    paramName: "validity",

                                },*/
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
                                 /* {
                                      filteringMethod: null,
                                      filteringMethodDef: null,
                                      paramName: "extra_1",
                                  },
                                   {
                                       filteringMethod: null,
                                       filteringMethodDef: null,
                                       paramName: "extra_2",
                                   },
                                    {
                                        filteringMethod: null,
                                        filteringMethodDef: null,
                                        paramName: "extra_3",
                                    },
                                     {
                                         filteringMethod: null,
                                         filteringMethodDef: null,
                                         paramName: "extra_4",
                                     },
                                      {
                                          filteringMethod: null,
                                          filteringMethodDef: null,
                                          paramName: "extra_5",
                                      },
                                      {
                                          filteringMethod: null,
                                          filteringMethodDef: null,
                                          paramName: "extra_6",
                                      },
                                       {
                                           filteringMethod: null,
                                           filteringMethodDef: null,
                                           paramName: "extra_7",
                                       }*/
        ];

        for (var i = 0; i < newParamList.length; i++) {
            temp.push(newParamList[i]);
        }
        return temp;
    }
}

AfmSensorAClassDevice.prototype = new AfmSensorDeviceModule.AfmSensorDevice();
AfmSensorAClassDevice.prototype.constructor = AfmSensorAClassDevice;
AfmSensorAClassDevice.prototype.parent = AfmSensorDeviceModule.AfmSensorDevice.prototype;


// export the class
module.exports =
{
    AfmSensorAClassDevice
};
