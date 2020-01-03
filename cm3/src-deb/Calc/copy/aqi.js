 var UnitConverterModule = require('./Utils/UnitConverter.js');
var unitConverter = new UnitConverterModule.UnitConverter();

 var paramName  = "PM2P5";
 var valueInPPm = 58;
 var ugPerM3 = unitConverter.convertPPMtoUgM3(paramName, valueInPPm, null, null);
 var aqiVal = unitConverter.convertUgM3ToAqi(paramName.toUpperCase(), ugPerM3);
 
 console.log("ug per m3 :",ugPerM3);
 console.log("aqiVal :",aqiVal);