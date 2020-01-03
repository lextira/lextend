var DatabaseHandlerModule = require('../DatabaseHandler.js');
var dbInstance = new  DatabaseHandlerModule.DatabaseHandler();
var moment = require('moment-timezone');

function StatisticsManager()
{
    this.convertDateToTimeZone= function(dateObj,timeZoneName)
    {
        var res = dateObj;
        if (timeZoneName != null)
        {
            var mtz = moment.tz(timeZoneName);//
            //mtz.utcOffset() * 60000
            var zoneChanged = moment.tz(dateObj.valueOf() , timeZoneName);//

            var date = zoneChanged.date();
            var year = zoneChanged.year();
            var month = zoneChanged.month();
            //console.log("&&&&&&&&&&&&&&&&&&& date", date, mtz.utcOffset());
            
            res = new Date(year, month, date);
            var currentEpoch = res.valueOf();
            //console.log("&&&&&&&&&&&&&&&&&&& currentEpoch ", currentEpoch);
            res = new Date(currentEpoch - (mtz.utcOffset() * 60000));
            //console.log("&&&&&&&&&&&&&&&&&&& res.epoch", res.valueOf());
            //console.log("&&&&&&&&&&&&&&&&&&&");
        }
        return res;
    }
    this.dateToDailyUsageKey = function(dateObj,timeZoneName)
    {

        var date = dateObj.getDate();
        var year = dateObj.getFullYear();
        var month = dateObj.getMonth() + 1;

        if (timeZoneName != null) {
            var zoneChanged = moment.tz(dateObj.valueOf(), timeZoneName);//

            date = zoneChanged.date();
            year = zoneChanged.year();
            month = zoneChanged.month()+1;
        }

        var result = date + "." + month + "." + year;
        return result;
    }

    this.dateToMonthlyUsageKey = function (dateObj, timeZoneName) {
        var year = dateObj.getFullYear();
        var month = dateObj.getMonth() + 1;

        if (timeZoneName != null) {

            var zoneChanged = moment.tz(dateObj.valueOf(), timeZoneName);//
            year = zoneChanged.year();
            month = zoneChanged.month() + 1;
        }

        var result =  month + "." + year;
        return result;
    }

    this.dateToYearlyUsageKey = function (dateObj, timeZoneName) {
        var year = dateObj.getFullYear();

        if (timeZoneName != null) {

            var zoneChanged = moment.tz(dateObj.valueOf(), timeZoneName);//
            year = zoneChanged.year();
        }


        var result =  year;
        return result;
    }
    this.getStatItemFromList = function (list, key)
    {
        var result = null;
       // console.log("%%%%%%%%%%%%%%", list);
        for (var i = 0; i < list.length; i++) {
            if (list[i].key == key) {
                result = list[i];
                break;
            }
        }

        return result;
    }
    

    this.createNewStatCollection = function (paramName, value,currentDate, key) {

        var newDoc =
        {
            "paramName": paramName,
            "epoch" : currentDate.valueOf(),
            "key": key,
            "statParams": {
                "sum": parseFloat(value),
                "count": 1,
                "min": value,
                "max": value
             }
        };
        return newDoc;

    }


    this.updateYearlyStats = function (collectionName, paramName, value, currentDate,timeZoneName, callBack) {
        if (collectionName != null && currentDate != null && paramName != null)
        {
            var originalDate = new Date(currentDate.valueOf());
            currentDate = this.convertDateToTimeZone(currentDate, timeZoneName);
            //currentDate = new Date(currentDate.getFullYear(), 0, 1, 0, 0, 0, 0);
            
            var deviceQuery =
            {
                "paramName": { $in: [paramName] },
                "key": this.dateToYearlyUsageKey(originalDate, timeZoneName)
            }
            var myInstance = this;
            dbInstance.GetDocumentByCriteria(collectionName, 0, deviceQuery, function (err, result) {
                if (err) {
                    var newCollectionItem = myInstance.createNewStatCollection(paramName, value, currentDate, myInstance.dateToYearlyUsageKey(originalDate, timeZoneName));
                    dbInstance.insertDocument(collectionName, newCollectionItem, function (addErr) {
                        callBack(addErr);
                    });

                }
                else {

                    if (result != null) {
                        result.statParams.sum += parseFloat(value);
                        result.statParams.count +=  1;
                        result.statParams.min = Math.min(result.statParams.min, value);
                        result.statParams.max = Math.max(result.statParams.max, value);
                    }
                    dbInstance.updateDocument(collectionName, deviceQuery, result, function (errUpdate) {
                        callBack(errUpdate);
                    });
                }

            });
        }
        else {

            // error
            callBack(1)
        }

    }


    this.updateMonthlyStats = function (collectionName, paramName, value, currentDate, timeZoneName,callBack) {
        if (collectionName != null && currentDate != null && paramName != null)
        {
            var originalDate = new Date(currentDate.valueOf());
            currentDate = this.convertDateToTimeZone(currentDate, timeZoneName);
            //currentDate  = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);
            //currentDate.setHours(0, 0, 0, 0);
            //currentDate.setDate(1);;
            var deviceQuery =
            {
                "paramName": { $in: [paramName] },
                "key": this.dateToMonthlyUsageKey(originalDate, timeZoneName)
            }
            var myInstance = this;
            dbInstance.GetDocumentByCriteria(collectionName, 0, deviceQuery, function (err, result) {
                if (err) {
                    var newCollectionItem = myInstance.createNewStatCollection(paramName, value, currentDate, myInstance.dateToMonthlyUsageKey(originalDate, timeZoneName));
                    dbInstance.insertDocument(collectionName, newCollectionItem, function (addErr) {
                        callBack(addErr);
                    });

                }
                else {

                    if (result != null) {
                        
                        result.statParams.sum += parseFloat(value);
                        result.statParams.count += 1;
                        result.statParams.min = Math.min(result.statParams.min, value);
                        result.statParams.max = Math.max(result.statParams.max, value);
                    }
                    dbInstance.updateDocument(collectionName, deviceQuery, result, function (errUpdate) {
                        callBack(errUpdate);
                    });
                }

            });
        }
        else {

            // error
            callBack(1)
        }

    }

    this.updateDailyStats = function (collectionName, paramName, value, currentDate, timeZoneName,callBack)
    {
        if (collectionName != null && currentDate != null && paramName != null) 
        {
		   var myInstance = this;
            //timeZone
            var originalDate = new Date(currentDate.valueOf());
            currentDate =  this.convertDateToTimeZone(currentDate, timeZoneName);
            //currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
            
            var deviceQuery =
            {
                "paramName": { $in: [paramName] },
                "key": this.dateToDailyUsageKey(originalDate, timeZoneName)
            }
			
			dbInstance.createUniqueIndex( collectionName,{ paramName: 1, key: 1 },function(errIndex,nameIndex){
			
				var newCollectionItem = myInstance.createNewStatCollection(paramName, value, currentDate, myInstance.dateToDailyUsageKey(originalDate, timeZoneName));
				dbInstance.insertDocument(collectionName, newCollectionItem, function (addErr) {
					if(addErr){
					
						dbInstance.GetDocumentByCriteria(collectionName, 0, deviceQuery, function (err, result)
						{
							if (err) {
								callBack(err);

							}
							else
							{
							   
								if (result != null)
								{
									result.statParams.count +=  1;
									result.statParams.sum += parseFloat(value);
									result.statParams.min = Math.min(result.statParams.min, value);
									result.statParams.max = Math.max(result.statParams.max, value);
								}
								dbInstance.updateDocument(collectionName, deviceQuery, result, function (errUpdate)
								{
									callBack(errUpdate);
								});
							}

						});
						
					}
					else
					{
						callBack(addErr);
					}
				});
			
			});

			
            
        }
        else {

            // error
            callBack(1)
        }

    }

    this.getReceivedTimeQueryJson = function (timeStart, timeEnd) {
        var res = null;
        if (timeStart != null && timeEnd != null) {
            res = [
                               { "epoch": { $gte: parseInt(timeStart) } },
                               { "epoch": { $lte: parseInt(timeEnd) } }
            ]
        }
        else if (timeStart != null) {
            res = [
                               { "epoch": { $gte: parseInt(timeStart) } }
            ]
        }
        else if (timeEnd != null) {
            res = [
                               { "epoch": { $lte: parseInt(timeEnd) } }
            ]
        }

        return res;

    }

    //this.getDailyStatParam = function (collectionName, paramNameList, timeFrom,timeTo,callBack) {

    //    var deviceQuery =
    //    {
    //        "paramName": { $in: paramNameList },
    //        $and: getReceivedTimeQueryJson(timeFrom, timeTo)
    //    }
        
    //    dbInstance.GetFilteredDocumentSorted(collectionName, deviceQuery, {}, { "epoch": -1 }, function (err, result)
    //    {

    //        if (err)
    //        {
    //            console.log("getsensor stat");
    //            callBack(1, null)
    //        }
    //        else {
    //            callBack(null, result)
    //        }

    //    });
    //}

    this.getStatParam = function(collectionName,paramNameList,timeFrom,timeTo,limit,offset,callBack)
    {
	console.log("%%%% getstat	",collectionName,paramNameList,timeFrom,timeTo,limit,offset)
	var timeFrom1=parseInt(timeFrom)-parseInt(19800000*2)
	var timeTo1=parseInt(timeTo)-parseInt(19800000*2)
	var timemax
	var timemin
	if(limit <20 && limit >14) limit =20
	//if(limit <10) limit =10
        var  statQuery =
        {
            "paramName": { $in: paramNameList },
           // $and: this.getReceivedTimeQueryJson(timeFrom,timeTo)
	   "epoch":{$gte:parseInt(timeFrom1),$lte:parseInt(timeTo1)}
        }
	if(timeFrom == null && timeTo == null){
		var statQuery=
		{
			"paramName":{$in: paramNameList}
		}
	}
	dbInstance.timeWindow(collectionName,{"epoch":-1},function(err,result){
	if(!err){
		timemax = parseInt(result)+parseInt(86400000)
		}
	})
	dbInstance.timeWindow(collectionName,{"epoch":1},function(err,result){
	if(!err){
		timemin = parseInt(result)
		}
	})
 
        if ( paramNameList == null || paramNameList.length <= 0)
            delete statQuery.paramName;
        if (statQuery.$and == null)
            delete statQuery.$and;

        dbInstance.GetFilteredDocumentSorted(collectionName, statQuery, { "_id": false, "epoch": false }, { "epoch": -1 }, limit, offset, function (err, result)
        {
	    if(timeTo1 >timemax || timeFrom1 <timemin){
		callBack(1,null)	
	    }           
            if (err)
            {
                
                callBack(1,null)
            }
            else
            {
		console.log("^^^db	",result)
                callBack(null, result)
            }

        });
    }


    this.getStatParamCount = function (collectionName, paramNameList, timeFrom, timeTo, callBack) {

        var statQuery =
        {
            "paramName": { $in: paramNameList },
            $and: this.getReceivedTimeQueryJson(timeFrom, timeTo)

        }
        if ( paramNameList == null || paramNameList.length <= 0)
            delete statQuery.paramName;
        if (statQuery.$and == null)
            delete statQuery.$and;

        dbInstance.getDocumentCountByCriteria(collectionName, statQuery, function (err, result) {

            if (err) {

                callBack(1, null)
            }
            else {
                callBack(null, result)
            }

        });
    }

}





// export the class
module.exports =
 {
     StatisticsManager
 };
