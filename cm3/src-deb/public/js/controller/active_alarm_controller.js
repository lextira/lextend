angular.module('F1FeederApp.controllers').
  
  controller('activeAlarmsController', function($scope, $routeParams, $location, $rootScope, $localStorage, ergastAPIservice) {
    $scope.id = $routeParams.id;
    $scope.races = [];
    $scope.driver = null;
	$rootScope.loggedIn = false;
	$scope.userName = null;
	$scope.password = null;
	var allDeviceList = [];
	$scope.deviceAvilable = [];

	var pageSize = 100;
	var offset = 0;
	var totalCount = 0;

	$scope.epochToString = function (epoch) {
	    return new Date(epoch).toString();
	}

	$scope.clearAlarmButtonClick = function (record) {

	    var newObject = JSON.parse(JSON.stringify(record));
	    delete newObject.alarmTime;
	    delete newObject.index;
	    if (newObject.liveLog != null) {
	        for (var k = 0; k < newObject.liveLog.length; k++) {
	            delete newObject.liveLog[k].uniqueId;
	        }
	    }

	    
	    newObject.alarmStatus = "NotActive";
	    ergastAPIservice.updateAlarmRecord(newObject, function (err) {
	        alert("Alarm succesfully cleared");
	        record.alarmStatus = "NotActive";
	    })
	}


	var fetchAlarmRecords = function (filterName) {
	    $scope.numberOfRecords = 0;
	    $scope.alarmRecords = [];
	    totalCount = 0;
	    ergastAPIservice.getAlarmRecordCount(filterName, function (err, count) {
	        totalCount = count;
	        $scope.numberOfRecords = totalCount;
	        ergastAPIservice.getAlarmRecords(filterName, pageSize, offset, function (err1, records) {
				var uniqueId = 1;
				
	            for (var i = 0; i < records.length; i++) {
					var d //= new Date(records[i].timeStamp);
					if(records[i].clearedTime){
						console.log("@@@@@@@@@@ cleared		",records[i].clearedTime)
						d = new Date(records[i].clearedTime)
						//records[i].alarmTime= d.toString();
					}
					else{
						console.log("@@@@@@@@@@ timestamp	",records[i].timeStamp)
						d = new Date(records[i].timeStamp)
					}
	                records[i].alarmTime = d.toString();
	                records[i].index = i+1;

	                if (records[i].liveLog != null) {
	                    for (var j = 0; j < records[i].liveLog.length; j++) {
	                        records[i].liveLog[j].uniqueId = uniqueId.toString();
	                        uniqueId++;
	                    }
	                }
	            }

	            $scope.alarmRecords = records;

	            

	        });

	    })
	}

	$scope.showPrevPageDataToAlarmRecords = function () {
	    if ((offset - pageSize) >= 0 ) {
	        offset -= pageSize;
	    }
	    $scope.selectAlarmRuleFilter($scope.selectedAlarmRule);
	}

	$scope.showNextPageDataToAlarmRecords = function () {
	    //100 100 150
        if ((offset + pageSize) < totalCount) {
	        offset += pageSize;
	    }
        $scope.selectAlarmRuleFilter($scope.selectedAlarmRule);
	}

	$scope.selectAlarmRuleFilter = function (rule) {
	    $scope.selectedAlarmRule = rule;
	    offset = 0;
	    if ($scope.selectedAlarmRule.ruleName == "[All]") {
	        fetchAlarmRecords(null);
	    }
	    else
	        fetchAlarmRecords($scope.selectedAlarmRule.ruleName);
	}

    

	var fetchCurrentRules = function (completionCallBack) {
	    $scope.avilableAlarmNames = [{ruleName: "[All]"}];
	    $scope.selectedAlarmRule = null;
	    ergastAPIservice.getAlarmRuleCount(null, function (err, count) {

	        if (!err && count > 0) {

	            var i = 0;

	            var fetchRule = function () {

	                ergastAPIservice.getAlarmRuleAt(null, i, function (err1, ruleInfo) {
	                    $scope.avilableAlarmNames.push(ruleInfo);
	                    //$scope.alarmrules.push(ruleInfo);
	                    i++;
	                    if (i < count)
	                        fetchRule();
	                    else {
	                        completionCallBack();
	                    }
	                })


	            }

	            fetchRule();


	        }
	        else
	            completionCallBack();
	    })
	}

	var initPage = function () {
	    fetchAlarmRecords(null);
	    fetchCurrentRules(function () {

	        if ($scope.selectedAlarmName == null && $scope.avilableAlarmNames.length > 0) {

	            $scope.selectedAlarmRule = $scope.avilableAlarmNames[0];

	        }
	    });
	    
	}

	initPage();

  });