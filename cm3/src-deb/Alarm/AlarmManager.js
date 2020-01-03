
var AlarmFactoryModule = require('./AlarmFactory.js');
var alarmFactory = new AlarmFactoryModule.AlarmFactory();

var DatabaseHandlerModule = require('../DatabaseHandler.js');
var dbInstance = new  DatabaseHandlerModule.DatabaseHandler();

function AlarmManager()
{
	this.getDeviceLocation = function(deviceId, callBack){

        var query = {};
        var locationName = null;
    
        query["deviceId"] = deviceId;
        dbInstance.GetDocumentByName('devices',query,async function(err,val){
            if(!err){
                if(val!=null){

                    locationName = val.location.landMark;

                }
               
             await callBack(null,locationName);
            }
        });
    }
    this.updateAlarmRecords = function (record, callBack) {

        var query = {};
        query.ruleName = record.ruleName;
        query.timeStamp = record.timeStamp;
        dbInstance.GetDocumentByName('alarm_records', query, function (err, currentRecord)
        {
            if (currentRecord.alarmStatus == "Active" && record.alarmStatus == "NotActive") {
                record.clearedTime = new Date().valueOf();
            }

            console.log("----------------->updateAlarmRecords", record)
            dbInstance.updateDocument('alarm_records', query, record, function (err1) {
                if (err1) {
                    callBack(1);
                }
                else {
                    callBack(null);
                }
            });
        });


       
    }

    this.getAlarmRecords = function (name, limit, offset, timeStart, timeEnd, callBack) {
        var alarmQuery = {
            ruleName: name
        };
        if (alarmQuery.ruleName == null)
            delete alarmQuery.ruleName;

        var excludeFields = { '_id': false };

        dbInstance.GetAllDocumentByCriteria('alarm_records', excludeFields, alarmQuery, limit, offset, function (err, result) {

            if (err) {
                callBack(1, null);
            }
            else {
                callBack(null, result);
            }

        });
    }

    this.getAlarmRecordsCount = function (name, callBack) {

        var alarmQuery =  {
			    ruleName: name
            };
        if (alarmQuery.ruleName == null)
            delete alarmQuery.ruleName;
        dbInstance.getDocumentCountByCriteria('alarm_records', alarmQuery, function (err, count) {
            if (err) {
                callBack(1, 0);
            }
            else {
                callBack(null, count);
            }
        });
    }

    this.getAlarmRecordWithLiveLogTimeStamp = function (liveLogDeviceTimeStamp, callBack) {

        var ruleQuery;
        ruleQuery =
		{
			"liveLog.timeStamp" : liveLogDeviceTimeStamp
		}
        
        dbInstance.GetAllDocumentByCriteria('alarm_records', {}, ruleQuery, null, null, function (err, result) {

            if (err) {
                callBack(1,null);
            }
            else {
                callBack(null,result);
            }

        });
    }

    this.addAlarmRecord = function (record, callBack) {

        console.log("alarmmanager record",record)
        dbInstance.insertDocument('alarm_records', record);
        callBack(null);
            
    }



    this.updatAlarmRule = function (rule, callBack) {




        var query = {};
        query.ruleName = rule.ruleName;
        dbInstance.GetDocumentByName('alarm_rules', query, function (err, currentRule) {
            if (err) {
                callBack(1);
            }
            else {
                dbInstance.updateDocument('alarm_rules', query, rule, function (err1) {
                    if (err1) {
                        callBack(1);
                    }
                    else {
                        callBack(null);
                    }
                });
            }
        });



    }


    /*
    *      alarm:   { ruleName : "rrr",
                      type     : "device",
                      info     : {
                                     paramDefinitions: [
                                      {
                                           CO  : { minLimit : 100, maxLimit:200 },
                                           SO2 : { minLimit : 100, maxLimit:200 },
                                           AA  : { minLimit : 100, maxLimit:200 },
                                      }
                                     
                                     ]

                                   }
    *
    */
    this.addAlarmRule = function (alarmDetails, callBack) {

        var alarm = null;
        alarm = alarmFactory.createAlarmInstanceFromType(alarmDetails.type);
        alarm.parse(alarmDetails);

        var query = {};
        query['ruleName'] = alarmDetails.ruleName;
        dbInstance.IsDocumentExist('alarm_rules', query, function (err, result) {
            if (result != 'success') {
                dbInstance.insertDocument('alarm_rules', alarm);
                callBack(null);
            } else {
                callBack(1);
            }
        });
    }

    this.removeAlarmRule = function (ruleName, callBack) {
        var query = {};
        query['ruleName'] = ruleName;

        dbInstance.GetDocumentByName('alarm_rules', query, function (err, result) {
            if (err || result == null) {
                callBack(1);
            }
            else {
                
                dbInstance.removeDocument('alarm_rules', query, function (errRemove, res) {
                    callBack(errRemove != null ? 1 : null);

                    dbInstance.removeDocument('alarm_records', query, function (errRemove, res) {

                    });


                });

               
            }

        });
    }


    this.getAlarmRuleAt= function (type, index, callBack) {
        var ruleQuery;
        if (type == null)
            type = "";
        if (type != null ) {
            var regExp = new RegExp(".*" + type + ".*");
            ruleQuery =
			{
			    $or: [
						{ type: { "$regex": regExp, "$options": "-i" } }
			    ]
			}
        }

        dbInstance.GetDocumentByCriteria('alarm_rules', index, ruleQuery, function (err, result) {

            if (err) {
                callBack(null);
            }
            else {
                callBack(result);
            }

        });

    };


    this.getAlarmRuleCount= function (type, callBack) {

        var alarmQuery;
        if (type == null)
            type = "";
        if (type != null) {
            var regExp = new RegExp(".*" + type + ".*");
            alarmQuery =
			{
			    $or: [
						{ type: { "$regex": regExp, "$options": "-i" } }
			    ]
			}
        }

        // use searchCriteria to filter the project from DB
        dbInstance.getDocumentCountByCriteria('alarm_rules', alarmQuery, function (err, count) {
            if (err) {
                callBack(1, 0);
            }
            else {
                callBack(null, count);
            }
        });
    };

}


// export the class
module.exports =
 {
     AlarmManager
 };
