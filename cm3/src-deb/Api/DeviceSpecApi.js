
var  responseModule =  require('../HubResponse');

var  requestValidationModule =  require('../RequestValidation.js');
var requestValidation = new  requestValidationModule.RequestValidation();

var AfmDevSpecModule = require('../DeviceSpec/AfmEthernetDeviceSpec.js');

var AfmSensorAClassDeviceSpecModule = require('../DeviceSpec/AfmSensorAClassDeviceSpec.js');
var RaipurDeviceSpecModule = require('../DeviceSpec/RaipurDeviceSpec.js');
var PanicButtonDeviceSpecModule = require('../DeviceSpec/PanicButtonDeviceSpec.js');


function DeviceSpecApi(express)
{
    express.get('/device/spec', function (req, res) 
	{
		
		console.log('fetching device spec..');
		var hubResponse = new responseModule.HubResponse();
		var response = null;
		requestValidation.isValidUser(req.query.userId,req.query.authPassword,function(result)
		{
			
			if(result == null)
			{
				response  = hubResponse.getErrorResponse(-1,"Invalid request from client");
				res.end(response);
				
			}
			else
			{
			    if (req.query.type == "AFMEthernet")
			    {
			        var devSpec = new AfmDevSpecModule.AfmEthernetDeviceSpec();
			        hubResponse.data = devSpec;
			        response = hubResponse.getOkResponse();
			        res.end(response);
			    }
			    else if (req.query.type == "EnvSensorDevice") {
			        var devSpec = new AfmSensorAClassDeviceSpecModule.AfmSensorAClassDeviceSpec();
			        hubResponse.data = devSpec;
			        response = hubResponse.getOkResponse();
			        res.end(response);
				}
				else if (req.query.type == "RaipurDevice") {
			        var devSpec = new RaipurDeviceSpecModule.RaipurDeviceSpec();
			        hubResponse.data = devSpec;
			        response = hubResponse.getOkResponse();
			        res.end(response);
				}
				else if (req.query.type == "PanicButtonDevice") {
			        var devSpec = new PanicButtonDeviceSpecModule.PanicButtonDeviceSpec();
			        hubResponse.data = devSpec;
			        response = hubResponse.getOkResponse();
			        res.end(response);
				}

			    
			}
		});
	
  });
}

// export the class
module.exports =
 {
     DeviceSpecApi
 };
