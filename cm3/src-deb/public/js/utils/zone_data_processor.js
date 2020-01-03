function ZoneDataProcessor(devDeploymentList,devAPI) {
    this.deploymentList = devDeploymentList;
    this.deviceApi = devAPI;
    
    //var init = function () {

    //    if (this.deploymentList != null) {

    //        for (var j = 0; j < this.deploymentList.length; j++) {

    //            cityLists.add(this.deploymentList[j].city);
    //        }

    //        res = Array.from(cityLists);
    //    }

    //}

    //init();

    this.getParamDefinitionForClass = function (className) {

        var result = null;
        if (this.paramDefinitionPerClass[className] != null) {
            var listParams = this.paramDefinitionPerClass[className];
            result = listParams;
        }
        return result;
    }

    this.getParamDefinitionForItem = function (className, paramName) {

        var result = null;
        if (this.paramDefinitionPerClass[className] != null) {
            var listParams = this.paramDefinitionPerClass[className];
            for (var j = 0; j < listParams.length; j++) {
                if (listParams[j].paramName == paramName) {

                    result = listParams[j];
                    break;
                }
            }
        }
        return result;
    }

    this.getAllCityList = function () {
        
        var res = null;
        var cityLists = new Set();
        if (this.deploymentList != null) {

            for (var j = 0; j < this.deploymentList.length; j++) {

                cityLists.add(this.deploymentList[j].city);
            }
            
            res =  Array.from(cityLists);
        }
        return res;

    }

    this.getAllZoneList = function () {

        var res = null;
        var zoneLists = new Set();
        if (this.deploymentList != null) {

            for (var j = 0; j < this.deploymentList.length; j++) {

                zoneLists.add(this.deploymentList[j].zone);
            }

            res = Array.from(zoneLists);
        }
        return res;

    }

    
    this.creaateDeviceIdsPerClassMapping = function (city,zone) {


        var myInst = this;
        var addToPerClassDict = function (cityZoneDevices) {
            for (var k = 0; k < cityZoneDevices.length; k++) {

                if (myInst.deviceIdPerClass[cityZoneDevices[k].subType] == null) {
                    myInst.deviceIdPerClass[cityZoneDevices[k].subType] = { devIds: [] };
                }
                myInst.deviceIdPerClass[cityZoneDevices[k].subType].devIds.push(cityZoneDevices[k].deviceId);
            }
        };

        for (var j = 0; j < this.deploymentList.length; j++) {

            if (city != null && zone != null) {
                if (city == this.deploymentList[j].city && zone == this.deploymentList[j].zone) {
                    addToPerClassDict(this.deploymentList[j].devices);
                }
            }
            else if (city == this.deploymentList[j].city || zone == this.deploymentList[j].zone) {
                addToPerClassDict(this.deploymentList[j].devices);

            }

        }
    }


    this.createParamDefinitionsPerClass = function (callBack) {

        var subTypeList = [];
        for (var subType in this.deviceIdPerClass) {
            subTypeList.push(subType);
        }

        var myInstance = this;
        var i = 0;
        var addParamDefinitionForSubType = function () {

            myInstance.deviceApi.getDeviceSpec(subTypeList[i], function (err, spec) {

                myInstance.paramDefinitionPerClass[spec.id] = spec.paramDefinitions;
                
                i++;
                if (i < subTypeList.length) {
                    addParamDefinitionForSubType();
                }
                else
                    callBack();

            });
        }

        if (i < subTypeList.length)
            addParamDefinitionForSubType();
        else
            callBack();
        
    }

    this.getResult = function () {
        return this.zoneWiseInfoPerClass;
    }

    this.processData = function (city, zone,timeEpoch,numberOFDays,callBack) {

        if (city == null && zone == null)
            return;

        var myInst = this;
        this.deviceIdPerClass = {};
        this.paramDefinitionPerClass = {};
        this.zoneWiseInfoPerClass=  {};

        this.creaateDeviceIdsPerClassMapping(city,zone);
        this.createParamDefinitionsPerClass(function () {

            var dayIndex = 0;

            var funcProcess = function () {
                myInst.processZoneWiseDailyData(timeEpoch, function () {
                    

                    dayIndex++;
                    if (dayIndex < numberOFDays) {
                        timeEpoch -= 24 * 60 * 60 * 1000;
                        funcProcess();
                    }
                    else {
                        // processing completed
                        processAverage(myInst.zoneWiseInfoPerClass);
                        callBack();
                    }
                });
            }
           

            if (dayIndex < numberOFDays){
                funcProcess();
            }
           
        })
        
    }

    var processAverage = function (zoneWiseInfoPerClass) {

        for (var className in zoneWiseInfoPerClass) {
            var listZoneInfoForDays = zoneWiseInfoPerClass[className];
            for (var j = 0; j < listZoneInfoForDays.length; j++) {
                if (listZoneInfoForDays[j].stat!= null)
                {
                    var statInfo = listZoneInfoForDays[j].stat;
                    for (var pName in statInfo) {
                        
                        var avgList = statInfo[pName].avg;
                        var sum = 0;
                        for (var val = 0; val < avgList.length; val++)
                        {
                            sum += avgList[val];
                        }
                        if (avgList == null || avgList.length == 0) {
                            var b = 0;
                            b++;
                        }
                        var zoneAvg = sum / avgList.length;
                        statInfo[pName].avg = zoneAvg;
                    }
                }
            }
        }
    }

    var mergeZoneWiseData = function (deviceStat, allZoneData,timeEpochSelected) {

        /*
                deviceStat
                {
			        CO : { min: 100, max:100,avg:[11]} ,
			        SO : { min: 100, max:100,avg:[11]} ,
		        }
        
        */
        // merge statstics of current device with zone info
        var p = 0;
        for (; p < allZoneData.length; p++) {
            if (allZoneData[p].epoch == timeEpochSelected) {

                var zoneStat = allZoneData[p].stat;

                for (var pname in deviceStat) {
                    if (zoneStat[pname] != null) {

                        zoneStat[pname].min = Math.min(zoneStat[pname].min, deviceStat[pname].min);
                        zoneStat[pname].max = Math.max(zoneStat[pname].max, deviceStat[pname].max);
                        zoneStat[pname].avg.push(deviceStat[pname].avg[0]);
                    }
                    else
                    {
                        zoneStat[pname] = deviceStat[pname];
                    }
                    
                }
                break;
            }
        }

        if (p >= allZoneData.length) {
            // new record
            allZoneData.push({
                epoch: timeEpochSelected,
                stat: deviceStat
            })
        }
    }

    this.processZoneWiseDailyData = function (timeOfDay,completionCallBack) {

        var myInstance = this;
        var subTypes = [];
        for (var subType in this.deviceIdPerClass) {
            subTypes.push(subType);
        }

        var j = 00;
        var makeDeviceClassInfo = function () {

            var nextDeviceClass = function () {
                j++;
                if (j < subTypes.length)
                    makeDeviceClassInfo();
                else
                    completionCallBack();
            }

            var devIds = myInstance.deviceIdPerClass[subTypes[j]].devIds;
            if (devIds != null) {


                var devIndex = 0;
                var fetchDeviceInfo = function () {

                    var id = devIds[devIndex];
                    // get daily stat for this id.
                    var timeEnd = timeOfDay + (24 * 60 * 60 * 1000)-1;
                    myInstance.deviceApi.getStatDataForDevice([id], null, 0, timeOfDay, timeEnd, "daily", null, function (statDataList) {

                        if (statDataList.statPerDeviceId != null && statDataList.statPerDeviceId.length >0 
                            && statDataList.statPerDeviceId[0].deviceId == id) {
                            var dailyStatdata = statDataList.statPerDeviceId[0].stat.dailyStat;

                            
                            var temp = {}
                            for (var t = 0; t < dailyStatdata.length; t++) {

                                var zoneStat = {};
                                zoneStat["min"] = dailyStatdata[t].statParams.min;
                                zoneStat["max"] = dailyStatdata[t].statParams.max;
                                zoneStat["avg"] = [dailyStatdata[t].statParams.sum / dailyStatdata[t].statParams.count];

                                temp[dailyStatdata[t].paramName] = zoneStat;
                            }

                            if (myInstance.zoneWiseInfoPerClass[subTypes[j]] == null) {
                                myInstance.zoneWiseInfoPerClass[subTypes[j]] = [{
                                        epoch: timeOfDay,
                                        stat: temp
                                    }];
                            }
                            else {
                                var currenStatList = myInstance.zoneWiseInfoPerClass[subTypes[j]];

                                // merge statstics of current device with zone info
                                mergeZoneWiseData(temp, currenStatList, timeOfDay);
                            }
                        }

                        devIndex++;
                        if (devIndex < devIds.length)
                            fetchDeviceInfo();
                        else {
                            // completed this device class
                            nextDeviceClass();
                        }

                   });

                   
                }


                
                if (devIndex < devIds.length)
                    fetchDeviceInfo();
                


            }

        }

        
        if (j < subTypes.length)
            makeDeviceClassInfo();
        else
            completionCallBack();

    }



}
