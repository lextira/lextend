var deviceModule = require('./Device.js');

var DeviceFactoryModule = require('./DeviceFactory.js');
var devFactory = new DeviceFactoryModule.DeviceFactory();

var DatabaseHandlerModule = require('../DatabaseHandler.js');
var dbInstance = new  DatabaseHandlerModule.DatabaseHandler();

function DeviceManager()
{

    // returns the number of devices matching with city and zone informations
    this.getDeviceCountMatchWithCityZone = function (city,zone, callBack) {

        var deviceQuery = {};
        if (city != null) deviceQuery["location.city"] = city;

        dbInstance.getDocumentCountByCriteria('devices', deviceQuery, function (err, count) {
            if (err) {
                callBack(1, 0);
            }
            else {
                callBack(null, count);
            }
        });
    };

    this.getDeviceAtMatchWithCityZone = function (city, zone, index, callBack) {
        var deviceQuery = {};

        if (city != null ) deviceQuery["location.city"] = city;
        
        dbInstance.GetDocumentByCriteria('devices', index, deviceQuery, function (err, result) {

            if (err) {
                callBack(err,null);
            }
            else {
                callBack(null,result);
            }

        });

    };



    this.getDeviceCount = function (substringFamily, callBack)
    {

        console.log("substringFamily", substringFamily);
        var deviceQuery;
        if (substringFamily == null)
            substringFamily = "";
        if (substringFamily != null)
        {
            console.log("reg:", ".*" + substringFamily + ".*");
            var regExp = new RegExp(".*" + substringFamily + ".*");
            deviceQuery  =
			{
			    $or: [
						{ devFamily: { "$regex": regExp, "$options": "-i" } }
			    ]
			}
            console.log('deviceQuery = ', deviceQuery);
        }

        // use searchCriteria to filter the project from DB
        dbInstance.getDocumentCountByCriteria('devices', deviceQuery, function (err, count)
        {
            if (err)
            {
                callBack(1,0);
            }
            else
            {
                console.log("document count: " + count);
                callBack(null,count);
            }
        });
    };
  

    this.getDeviceAt = function (query, index, callBack) {
        var deviceQuery;
        if (query != null && query.hasOwnProperty('substring')) 
		{
            console.log('query.substring =', query.substring);
            var substring = query.substring;
            var regExp = new RegExp(".*" + substring + ".*");
            console.log('regular expression = ', regExp);
            deviceQuery =
			{
			    $or: [
						{ devFamily: { "$regex": regExp, "$options": "-i" } }
			    ]
			}
        } 

        dbInstance.GetDocumentByCriteria('devices', index, deviceQuery, function (err, result) {

            if (err) {
                callBack(null);
            }
            else {
                callBack(result);
            }

        });

    };


   

    this.getDeviceFromId = function (id, callBack)
    {
        var query = { "deviceId": id };
        var myInstance = this;
        dbInstance.GetDocumentByName('devices', query, function (err, result)
        {
            if (err)
            {
                callBack(null);
            }
            else
            {
               callBack(result);
            }

        });
    }
	
	this.registerDevice = function(deviceDetails,callBack)
	{

	    var device = null;//new deviceModule.Device();
	    device = devFactory.createDeviceInstanceFromSubType(deviceDetails.subType);
      device.parse(deviceDetails);
	 
	  var query = {};
	  query['deviceId'] = deviceDetails.deviceId;
	  dbInstance.IsDocumentExist('devices',query, function(err, result)
	  {
			console.log('validation results =',result);
			if(result != 'success')
			{
				  dbInstance.insertDocument('devices',device);
				  callBack("success");
			}else
			{
				console.log('document with projectId already exist adding failed');
				callBack("failed");
			}
	  });     
    }
	
	
	this.updateDevice = function (deviceDetails,callBack) {

	    var device = null;//new deviceModule.Device();
	    device = devFactory.createDeviceInstanceFromSubType(deviceDetails.subType);
	    device.parse(deviceDetails);

	    var query = {};
	    query['logicalDeviceId'] = device.logicalDeviceId;
	    var myInstance = this;

	    dbInstance.GetDocumentByName('devices', query, function (err, oldDevice)
	    {

	        if (err)
	        {
	            callBack(1, "No device found");
	        }
	        else
	        {
	            dbInstance.updateDocument('devices', query, device,function(err1){


	                if (err1) {
	                    callBack(1, "Error occured while updating device");
	                }
	                else
	                {
	                    callBack(null, "Device update");
	                }
	            });
	        }
	    });
	}
	
	this.removeDevice = function(deviceId,callBack)
	{
		var query = {};
		query['deviceId'] = deviceId;

		dbInstance.GetDocumentByName('devices',query,function(err, result)
        {
			if(err)
			{
				 callBack(1);
			}else
			{
				if(result != null)
				{
				    var query = {
				        logicalDeviceId: result.logicalDeviceId
				    }
			
					dbInstance.removeDocument('devices',query, function(errFrmDevices, res)
					{
						  var docsToRemove = [result.logicalDeviceId, result.logicalDeviceId + "_stat_daily", result.logicalDeviceId + "_stat_monthly",
                              result.logicalDeviceId + "_stat_yearly", result.logicalDeviceId+"_raw"
						  ];
                          
						  var i = 0;
						  var allDeviceDocRemoved = errFrmDevices ? false : true;
						  var removeDoc = function (docName,removeCallBack) {

						      dbInstance.removeCollection(docName, function (err1) {
						          if (err1)
						              allDeviceDocRemoved = false;
						          i++;
						          if (i < docsToRemove.length) {
						              removeDoc(docsToRemove[i],removeCallBack)
						          }
						          else
						          {
						              var r = (allDeviceDocRemoved ? null : 1);
						              removeCallBack( r );
						          }

						      });

						  };


						  removeDoc(docsToRemove[i], callBack);

					});
				}
                else
				{
					callBack(1);
				}
				
			}
					
        });
    };
}


// export the class
module.exports =
 {
    DeviceManager
 };
