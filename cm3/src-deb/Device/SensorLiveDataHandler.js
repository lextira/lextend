var DatabaseHandlerModule = require('../DatabaseHandler.js');
var dbInstance = new DatabaseHandlerModule.DatabaseHandler();


function SensorLiveDataHandler() {

    this.getReceivedTimeQueryJson = function (timeStart, timeEnd) {
        var res = null;
        if (timeStart != null && timeEnd != null) {
            res = [
                               { "data.receivedTime": { $gte: parseInt(timeStart) } },
                               { "data.receivedTime": { $lte: parseInt(timeEnd) } }
            ]
        }
        else if (timeStart != null) {
            res = [
                               { "data.receivedTime": { $gte: parseInt(timeStart) } }
            ]
        }
        else if (timeEnd != null) {
            res = [
                               { "data.receivedTime": { $lte: parseInt(timeEnd) } }
            ]
        }

        return res;

    }

    this.getRawLiveData = function (sensorId, limit, offset, timeStart, timeEnd, callBack) {

        var collectionName = sensorId + "_raw";

        this.getLiveDataHelper(collectionName, sensorId, limit, offset, timeStart, timeEnd, callBack);
    }
    
    this.getLiveData = function (sensorId, limit, offset, timeStart, timeEnd, callBackData) {

        var collectionName = sensorId;
        console.log('getLiveData------------------------', collectionName);

        this.getLiveDataHelper(collectionName, sensorId, limit, offset, timeStart, timeEnd, callBackData);
    }
    this.getLiveDataHelper = function (collectionName,sensorId, limit, offset, timeStart, timeEnd, callBack) {

        var deviceId = sensorId;
        var myInstance = this;
        {
            {
                //device.logicalDeviceId;

                var timeCond = myInstance.getReceivedTimeQueryJson(timeStart, timeEnd);

                var deviceQuery =
       	        {
       	            logicalDeviceId: sensorId,
       	            $and: myInstance.getReceivedTimeQueryJson(timeStart, timeEnd)
       	        };

                if (timeCond == null) {
                    delete deviceQuery.$and;
                }

                console.log("sensor id.....,limit,offset", sensorId, limit, offset);
                var excludeFields = { '_id': false, 'deviceId': false };

                dbInstance.GetAllDocumentByCriteria(collectionName, excludeFields, deviceQuery, limit, offset, function (err, result) {


                    if (err) {
                        callBack(1, sensorId, null);
                    }
                    else {
                        callBack(null, sensorId, result);
                    }

                });

                return;
            }
        }
        callBack(1, sensorId, null);

    };
    
}

// export the class
module.exports =
 {
     SensorLiveDataHandler
 };
