var DeviceSpecModule = require('./DeviceSpec.js');

function RaipurDeviceSpec() {

    this.id = "RaipurDevice";
   

    this.getParamDefinitions = function () {

        var paramDefinitions = [
           {
               paramName: "temperature",
               displayName: "Temperature",
               displayNameHtml: "Temperature",
               unit: 'oC',
               unitDisplayHtml: '<sup>o</sup>C',
               isDisplayEnabled: true,
               displayImage: "temperature.png",
               isPrimary: false, // for display purpose in heatmap
               needsLiveData: false, // for display purpose in heatmap (as graph in selection pane)
               valuePrecision: 1,
               maxRanges: {
                   min: 0,
                   max: 60
               },
               limits: [
                    {
                        max: 10,
                        color: "00B050",
                        description: "Cold"
                    },
                    {
                        min: 10,
                        max: 15,
                        color: "92D050",
                        description: "Cool"
                    },
                    {
                        min: 15,
                        max: 25,
                        color: "FFFF00",
                        description: "Warm"
                    },
                    {
                        min: 25,
                        max: 37,
                        color: "FF9A00",
                        description: "Hot"
                    },
                    {
                        min: 37,
                        max: 40,
                        color: "FF0000",
                        description: "Very Hot"
                    },
                     {
                         min: 40,
                         color: "C00000",
                         description: "Extremely Hot"
                     }
               ]
           },
           //to be decided
           {
               paramName: "pressure",
               displayName: "Pressure",
               displayNameHtml: "Pressure",
               unit: 'hPa',
               unitDisplayHtml: 'hPa',
               displayImage: "pressure.png",
               isDisplayEnabled: true,
               needsLiveData: false,
               isPrimary: false,
               valuePrecision: 2,
               maxRanges: {
                   min : 300,
                   max : 1100
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
           
           //to be decided
            {
                paramName: "humidity",
                displayName: "Humidity",
                displayNameHtml: "Humidity",
                unit: '%RH',
                unitDisplayHtml: '%RH',
                isDisplayEnabled: true,
                needsLiveData: false,
                isPrimary: false,
                displayImage: "humidity.png",
                valuePrecision: 2,
                maxRanges: {
                    min: 1,
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
                paramName: "PM10",
                displayName: "PM10",
                displayNameHtml: "PM<sub>10</sub>",
                unit: 'ug/m3',
                unitDisplayHtml: '&mu;g/m<sup>3</sup>',
                isDisplayEnabled: true,
                needsLiveData: true,
                isPrimary: false,
                displayImage: "param.png",
                valuePrecision: 2,
                maxRanges: {
                    min: 0,
                    max: 1000
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
                          max: 251,
                          color: "FFB9B3",
                          description: "Moderate"
                      },
                      {
                          min: 251,
                          max: 351,
                          color: "FF9A00",
                          description: "Poor"
                      },
                      {
                          min: 351,
                          max: 430,
                          color: "FF0000",
                          description: "Very Poor"
                      },
                     {
                         min: 430,
                         
                         color : "800000",
                         description: "Severe"
                     }
               ]
            },
             
             {
                 paramName: "PM2p5",
                 displayName: "PM2.5",
                 displayNameHtml: "PM<sub>2.5</sub>",
                 unit: 'ug/m3',
                 unitDisplayHtml: '&mu;g/m<sup>3</sup>',
                 isDisplayEnabled: true,
                 needsLiveData: true,
                 isPrimary: false,
                 displayImage: "param.png",
                 valuePrecision: 2,
                 maxRanges: {
                     min: 0,
                     max: 500
                 },
                 limits: [
                    {
                        max: 30,
                        color: "00B050",
                        description: "Good"
                    },
                    {
                        min: 30,
                        max: 60,
                        color: "92D050",
                        description: "Satisfactory"
                    },
                      {
                          min: 60,
                          max: 90,
                          color: "FFB9B3",
                          description: "Moderate"
                      },
                      {
                          min: 90,
                          max: 120,
                          color: "FF9A00",
                          description: "Poor"
                      },
                      {
                          min: 120,
                          max: 250,
                          color: "FF0000",
                          description: "Very Poor"
                      },
                     {
                         min: 250,
                         
                         color : "800000",
                         description: "Severe"
                     }
               ]
             },

             
             {
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
                 valuePrecision: 3,
                 maxRanges: {
                     min: 0,
                     max: 100
                 },
                 limits: [
                    {
                        max: 0.811,
                        color: "00B050",
                        description: "Good"
                    },
                    {
                        min: 0.811,
                        max: 1.62,
                        color: "92D050",
                        description: "Satisfactory"
                    },
                      {
                          min: 1.62,
                          max: 8.11,
                          color: "FFB9B3",
                          description: "Moderate"
                      },
                      {
                          min: 8.11,
                          max: 13.8,
                          color: "FF9A00",
                          description: "Poor"
                      },
                      {
                          min: 13.8,
                          max: 27.6,
                          color: "FF0000",
                          description: "Very Poor"
                      },
                     {
                         min: 27.6,
                         
                         color : "800000",
                         description: "Severe"
                     }
               ]
             },
             
             
            {
                paramName: "NO2",
                displayName: "NO2",
                displayNameHtml: "NO<sub>2</sub>",
                unit: 'PPM',
                unitDisplayHtml: 'PPM',
                needsLiveData: true,
                displayImage: "param.png",
                isDisplayEnabled: true,
                isPrimary: false,
                valuePrecision: 3,
                maxRanges: {
                    min: 0,
                    max: 10
                },
                limits: [
                    {
                        max: 0.0197,
                        color: "00B050",
                        description: "Good"
                    },
                    {
                        min: 0.0197,
                        max: 0.0395,
                        color: "92D050",
                        description: "Satisfactory"
                    },
                      {
                          min: 0.0395,
                          max: 0.0889,
                          color: "FFB9B3",
                          description: "Moderate"
                      },
                      {
                          min: 0.0889,
                          max: 0.138,
                          color: "FF9A00",
                          description: "Poor"
                      },
                      {
                          min: 0.138,
                          max: 0.197,
                          color: "FF0000",
                          description: "Very Poor"
                      },
                     {
                         min: 0.197,
                         color : "800000",
                         description: "Severe"
                     }
               ]
            },

           
              
            {
                paramName: "SO2",
                displayName: "SO2",
                displayNameHtml: "SO<sub>2</sub>",
                unit: 'PPM',
                unitDisplayHtml: 'PPM',
                displayImage: "param.png",
                needsLiveData: true,
                isDisplayEnabled: true,
                isPrimary: false,
                valuePrecision: 3,
                maxRanges: {
                    min: 00,
                    max: 20
                },
                limits: [
                    {
                        max: 0.0142,
                        color: "00B050",
                        description: "Good"
                    },
                    {
                        min: 0.0142,
                        max: 0.0284,
                        color: "92D050",
                        description: "Satisfactory"
                    },
                      {
                          min: 0.0284,
                          max: 0.135,
                          color: "FFB9B3",
                          description: "Moderate"
                      },
                      {
                          min: 0.135,
                          max: 0.284,
                          color: "FF9A00",
                          description: "Poor"
                      },
                      {
                          min: 0.284,
                          max: 0.567,
                          color: "FF0000",
                          description: "Very Poor"
                      },
                     {
                         min: 0.567,
                         
                         color : "800000",
                         description: "Severe"
                     }
               ]
            },

           
            
            {
                paramName: "CO2",
                displayName: "CO2",
                displayNameHtml: "CO<sub>2</sub>",
                unit: 'PPM',
                unitDisplayHtml: 'PPM',
                displayImage: "param.png",
                needsLiveData: true,
                isDisplayEnabled: true,
                isPrimary: false,
                valuePrecision: 3,
                maxRanges: {
                    min: 0,
                    max: 5000
                },
                limits: [
                     {
                         max: 1000,
                         color: "00B050",
                         description: "Good"
                     },
                     {
                         min: 1000,
                         max: 2000,
                         color: "FFB9B3",
                         description: "Moderate"
                     },
                      {
                          min: 2000,
                          color: "FF0000",
                          description: "Very Poor"
                      }
                ]
            },

            {
                paramName: "uptime",
                displayName: "Up-Time",
                displayNameHtml: "Up-Time",
                unit: 's',
                unitDisplayHtml: 's',
                displayImage: "param.png",
                needsLiveData: false,
                isDisplayEnabled: false,
                isPrimary: false,
                valuePrecision: 0,
                maxRanges:null
            },
            
 
            {
                paramName: "receivedTime",
                displayName: "Received Time",
                displayNameHtml: "Received Time",
               // unit : "hms",
               unit: '',
              unitDisplayHtml: '',
                
                displayImage: "param.png",
                needsLiveData: false,
                isDisplayEnabled: true,
                isPrimary: false,
                valuePrecision: 0,
                maxRanges:null
            },
            {
                paramName: "AQI",
                displayName: "AQI",
                displayNameHtml: "AQI",
                unit: '',
                unitDisplayHtml: '',
                displayImage: "param.png",
                needsLiveData: false,
                isDisplayEnabled: true,
                isPrimary: true,
                valuePrecision: 0,
                isDerivedParam : true,
               
                maxRanges: {
                    min: 0,
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
            
        ];

        return paramDefinitions;
    }
    
    this.paramDefinitions = this.getParamDefinitions();
}

RaipurDeviceSpec.prototype = new DeviceSpecModule.DeviceSpec();
RaipurDeviceSpec.prototype.constructor = RaipurDeviceSpec;
RaipurDeviceSpec.prototype.parent = DeviceSpecModule.DeviceSpec.prototype;


// export the class
module.exports =
{
    RaipurDeviceSpec
};