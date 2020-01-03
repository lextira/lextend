function AFMParamSettings() {
    this.api = null;
    this.scope = null;
    this.init = function (scopeParam, devApi) {
        this.api = devApi;
        this.scope = scopeParam;
        this.scope.selectedDeviceParamDefs =
           [
                //{
                //    paramName: "CO",
                //    filteringMethod: "WMAFilter",
                //    filteringDef: {}
                //}
           ];
    }

    this.setParamSettingsForDeviceClass = function (type,completionCallBack) {
        var myInstance = this;
        if (type == "ESDEL001") {
            type = "EnvSensorDevice";
        }
        this.api.getDeviceSpec(type, function (err, specData) {
            if (!err && specData.paramDefinitions!= null) {

                myInstance.scope.selectedDeviceParamDefs = [];
                for (var j = 0; j < specData.paramDefinitions.length; j++) {

                    myInstance.scope.selectedDeviceParamDefs.push({
                        paramName: specData.paramDefinitions[j].paramName,
                        displayName: specData.paramDefinitions[j].displayName,
                        filteringMethod: "",
                        filteringMethodDef: {},
                        maxRanges: specData.paramDefinitions[j].maxRanges,
                        // default calibration (not fromr server)
                        calibration: { type : "curve",data:[ ]}
                    })
                }
                completionCallBack();

            }

        });
    }
}

angular.module('F1FeederApp.controllers').
  
  controller('deviceAdmin', function($scope, $routeParams,$location, ergastAPIservice) {
    $scope.id = $routeParams.id;
    $scope.races = [];
    $scope.driver = null;
	$scope.devices = [];
	$scope.isAddMode = true;
	$scope.isEditMode = false;

	var paramSettings = new AFMParamSettings();
	paramSettings.init($scope, ergastAPIservice);


	$scope.map = {
	    center: { latitude: 23.220325, longitude: 72.652877 },
	    zoom: 8,
	    markers: []
	};
	var updateDevicePanelTitle = function (isEdit) {
	    $scope.addDevicePanelTitle = isEdit ? "Update Device" : "Add New Device";
	}
	updateDevicePanelTitle(false);
	$scope.newDevSubtypeSelectionChanged = function () {
	    paramSettings.setParamSettingsForDeviceClass($scope.newDevSubType, function () {
	    });
	}

	var addMarkerToMap = function (deviceInfo) {
	    if ($scope.map != null && $scope.map.markers != null &&
            deviceInfo != null && deviceInfo.location != null
            ) {
	        var marker = {
	            id: deviceInfo.deviceId,
	            
	            coords: {
	                
	                latitude: parseFloat(deviceInfo.location.latitude),
	                longitude: parseFloat(deviceInfo.location.longitude)
	            }
	        };

	        $scope.map.markers.push(marker);
	        $scope.$apply();
	    }

	}

	
	$scope.updateDevice = function () {
	    $scope.isAddMode = true;
	    $scope.isEditMode = false;

	    var devInfo = {
	        logicalDeviceId:$scope.logicalDeviceId,
	        deviceId: $scope.newDevId,
	        description : $scope.newDevDescription,
	        type: $scope.newDevType,
	        devFamily: $scope.newDevFamily,
	        subType: $scope.newDevSubType,
	        timeZone: $scope.newDevTimeZone,
	        registerFrom: null,
	        registerTo: null,
	        customerName: $scope.newDevCustomerName,
	        lotNo: $scope.newDevLotNumber,
	        serialNo: $scope.newDevSerialNumber,
	        grade: $scope.newDevGrade,
	        deployment: $scope.newDevDeployment,
	        location: {

	            city: $scope.newDevCity,
	            zone:$scope.newDevZone,
	            landMark: $scope.newDevLandMark,
	            latitude: $scope.newDevLatitude,
	            longitude: $scope.newDevLongitude
	        },
	        paramDefinitions: $scope.selectedDeviceParamDefs
	    };

	    ergastAPIservice.updateDevice(devInfo, function (err) {
	        if (!err) {

	            for (var i = 0; i < $scope.devices.length; i++) {
	                if ($scope.devices[i].tag.logicalDeviceId == devInfo.logicalDeviceId) {
	                    $scope.devices[i].tag = devInfo;
	                    $scope.devices[i].deviceId = devInfo.deviceId;
	                    $scope.devices[i].type = devInfo.type;
	                    $scope.devices[i].devFamily = devInfo.devFamily;
	                    $scope.devices[i].subType = getDeviceSubTypeString(devInfo.subType);
	                    updateMarkerPosition(devInfo);

	                    break;

	                }
	            }
	            updateDevicePanelTitle(false);
                alert("Device updated successfully")
	        }
	    });

	    $scope.cancelEdit();

	}

	var updateMarkerPosition = function (deviceInfo) {

	    if ($scope.map.markers == null || deviceInfo == null)
	        return;

	    for (var i = 0; i < $scope.map.markers.length; i++) {
	        if ($scope.map.markers[i].id == deviceInfo.deviceId && deviceInfo.location!= null) {

	            $scope.map.markers[i].coords = {

	                latitude: parseFloat(deviceInfo.location.latitude),
	                longitude: parseFloat(deviceInfo.location.longitude)
	            }
	        }

	    }

	}

	var deviceInEdit = null;
	$scope.editDevice = function (deviceInfo,event) {

	    if (!showEditInProgressWarning(deviceInfo)) {
	        event.stopPropagation();
	        return;
	    }
        deviceInEdit = deviceInfo;
	    updateDevicePanelTitle(true);
	    $scope.logicalDeviceId = deviceInfo.tag.logicalDeviceId;
	    $scope.isAddMode = false;
	    $scope.isEditMode = true;
	    $scope.newDevId = deviceInfo.deviceId;
	    $scope.newDevType = deviceInfo.type;
	    $scope.newDevFamily = deviceInfo.devFamily;
	    $scope.newDevSubType = deviceInfo.tag.subType;

	    $scope.newDevTimeZone = deviceInfo.tag.timeZone;
	    $scope.newDevCustomerName = deviceInfo.tag.customerName;
	    $scope.newDevLotNumber = deviceInfo.tag.lotNo;
	    $scope.newDevSerialNumber = deviceInfo.tag.serialNo;
	    $scope.newDevGrade = deviceInfo.tag.grade;
	    $scope.newDevDeployment = deviceInfo.tag.deployment;

	    if (deviceInfo.tag.location!= null)
	    {
	        $scope.newDevCity = deviceInfo.tag.location.city;
	        $scope.newDevZone = deviceInfo.tag.location.zone;
	        $scope.newDevLandMark = deviceInfo.tag.location.landMark;
	        $scope.newDevLatitude= deviceInfo.tag.location.latitude;
	        $scope.newDevLongitude= deviceInfo.tag.location.longitude;
	    }
	    paramSettings.setParamSettingsForDeviceClass($scope.newDevSubType, function () {


	        for (var j = 0; j < $scope.selectedDeviceParamDefs.length; j++) {

	            var resFind = deviceInfo.tag.paramDefinitions.find(function (obj) {
	                return obj.paramName == $scope.selectedDeviceParamDefs[j].paramName;
	            })
	            if (resFind != null) {
	                $scope.selectedDeviceParamDefs[j].filteringMethod = resFind.filteringMethod;
	                $scope.selectedDeviceParamDefs[j].filteringMethodDef = resFind.filteringMethodDef;
	                $scope.selectedDeviceParamDefs[j].maxRanges = resFind.maxRanges;
	                if (resFind.calibration != null) {
	                    $scope.selectedDeviceParamDefs[j].calibration = resFind.calibration;
	                }
	                
	            }
	          
	        }

	    });
	    //selectedDeviceParamDefs
	   // $scope.selectedDeviceParamDefs = deviceInfo.tag.paramDefinitions;
	    
	    //paramDefinitions : $scope.selectedDeviceParamDefs
	}


      

	$scope.removeDevice = function (deviceIdToRemove) {
	    

	    if (confirm("Are you sure to remove device ? \r\nRemoving device will remove all data from system") == false) {
	        return;
	    }
	    if ($scope.isEditMode)
	    {
	        $scope.cancelEdit();
	    }
	    ergastAPIservice.removeDevice(deviceIdToRemove, function (err) {
	        for (var i = 0; i < $scope.devices.length; i++) {
	            if ($scope.devices[i].deviceId == deviceIdToRemove) {
	                $scope.devices.splice(i, 1);
	                break;

	            }
	        }
	        if (!err) {
	            alert("Successfull removed device");
	        }
	        else {
	            alert("Device removed,But some files can't be removed.");
	        }
	    });
	}
	var getDeviceSubTypeString = function (subType) {
	    if (subType == "EnvSensorDevice")
	        return "ESDEL001";
	    return subType;
	}

	

	$scope.addDevice = function(devId,newDevFamily,newDevSubType){

	    if ($scope.newDevId == null || $scope.newDevType == null || $scope.newDevFamily == null || 
			$scope.newDevSubType == null || $scope.newDevCustomerName == null ||
			$scope.newDevSerialNumber == null || $scope.newDevLatitude == null ||
			$scope.newDevLongitude == null || $scope.newDevLotNumber == null || $scope.newDevGrade == null
			|| $scope.newDevDeployment == null || $scope.newDevTimeZone == null ||
			$scope.newDevCity == null || $scope.newDevZone == null || $scope.newDevLandMark == null)
	    {
	        alert("Invalid device details. Fill all manadatory fields.")
	        return;
	    }

	    var devInfo = {
	        deviceId: $scope.newDevId,
	        type: $scope.newDevType,
	        devFamily: $scope.newDevFamily,
	        subType: $scope.newDevSubType,
	        timeZone : $scope.newDevTimeZone,
	        registerFrom: null, 
	        registerTo: null,
	        customerName: $scope.newDevCustomerName,
	        lotNo: $scope.newDevLotNumber,
	        serialNo: $scope.newDevSerialNumber,
	        grade: $scope.newDevGrade,
	        deployment: $scope.newDevDeployment,
	        location : {

	            city: $scope.newDevCity,
	            zone: $scope.newDevZone,
	            landMark: $scope.newDevLandMark,
	            latitude: parseFloat($scope.newDevLatitude),
	            longitude: parseFloat($scope.newDevLongitude)
	        },
            paramDefinitions : $scope.selectedDeviceParamDefs
	    };


		ergastAPIservice.addDevice(devInfo,function(err){
		    if (!err)
		    {
					alert("Device is added successfully");
					$scope.devices.push({
					    deviceId: devInfo.deviceId,
					    type: devInfo.type,
					    devFamily: devInfo.devFamily,
					    subType: getDeviceSubTypeString(devInfo.subType),
					    tag: devInfo
					});
					addMarkerToMap(devInfo);
		    }
		    else
		    {
		        alert("Invalid device parameters");
		    }
		});
	}
	
	$scope.getDeviceTableLoadedPercent = function () {
	    if ($scope.devices == null || $scope.deviceCount == null)
	        return 0;

	    var progress = ($scope.devices.length / $scope.deviceCount) * 100;
	    //alert(progress);

	    return progress;
	}


	ergastAPIservice.getDeviceCount("", function (count) {
	    $scope.isDeviceLoadingOngoing = true;
	    $scope.deviceCount = count;
	    var i =0;
	    var fetchDevice = function () {
		
			ergastAPIservice.getDeviceAt(null,i,function(deviceInfo){
				if(deviceInfo!= null){
				
				     $scope.devices.push({
				        deviceId: deviceInfo.deviceId,
				        type: deviceInfo.type,
				        devFamily: deviceInfo.devFamily,
				        subType: getDeviceSubTypeString(deviceInfo.subType),
				         tag:deviceInfo
				    });
				     addMarkerToMap(deviceInfo);
				
				}
				
				i++;
				if (i < count) {
				    fetchDevice();

				}
				else {
				    $scope.isDeviceLoadingOngoing = false;
				}



			});
	    }

	    if (i < count)
	        fetchDevice();
		
		
		
	
	});
	
	var devices = [];
	
	$scope.devices = devices;
	$scope.selectedDeviceInfo = null;

	$scope.cancelEdit = function () {

	    deviceInEdit = null;
	    $scope.logicalDeviceId = null;
	    $scope.isAddMode = true;
	    $scope.isEditMode = false;
	    $scope.newDevId = null;
	    $scope.newDevType = null;
	    $scope.newDevFamily = null;
	    $scope.newDevSubType = null;

	    $scope.newDevTimeZone = null;
	    $scope.newDevCustomerName = null;
	    $scope.newDevLotNumber = null;
	    $scope.newDevSerialNumber = null;
	    $scope.newDevGrade = null;
	    $scope.newDevDeployment = null;

	    $scope.newDevCity = null;
	    $scope.newDevZone = null;
	    $scope.newDevLandMark = null;
	    $scope.newDevLatitude = null;
	    $scope.newDevLongitude = null;
	    //selectedDeviceParamDefs
	    $scope.selectedDeviceParamDefs = null;


	}

	var showEditInProgressWarning = function (selectedDeviceInfo) {
	    var proceed = true;

	    var editInProgress = deviceInEdit != null && deviceInEdit.deviceId != selectedDeviceInfo.deviceId;
	    if (editInProgress) {
	        if (confirm("This will cancel the current edit, Are you sure?")) {
	            $scope.cancelEdit();
	        }
	        else {
	            proceed = false;;
	        }
	    }

	    return proceed;
	}

	$scope.selectParamTableRow= function (row) {

	    $scope.selectedParamRow = row;
	}
	$scope.selectDevice = function (row, deviceInfo) {

	    if ($scope.isEditMode)
	    {
	        if (!showEditInProgressWarning(deviceInfo))
              return;
	    }

	    $scope.selectedRow = row;
	    $scope.selectedDeviceInfo = deviceInfo;

	    showDeviceInMap(deviceInfo.tag);

	}


	$scope.addCurveCalibItem = function (calibrationInfo) {

	    if (calibrationInfo == null || calibrationInfo.type != "curve")
	        return;;
	    calibrationInfo.data.push({ min: null, max: null, offset: null,funct :"translate" });
	}

	$scope.removeCurveCalibItem = function (curveCalibItem, curveCalibItems) {
	    for (var i = 0; i < curveCalibItems.length; i++) {
	        if (curveCalibItems[i] == curveCalibItem) {
	            curveCalibItems.splice(i, 1);
	            break;
	        }
	    }
	
	}

	var showDeviceInMap = function (deviceInfo)
	{
	    if ($scope.map != null && $scope.map.markers != null &&
            deviceInfo != null && deviceInfo.location != null
            )
	    {

	        var mapCenter = {
	            latitude: parseFloat(deviceInfo.location.latitude),
	            longitude: parseFloat(deviceInfo.location.longitude)
	        }
	        $scope.map.center = mapCenter;
	        $scope.map.zoom = 17;
	        $scope.$apply();
	    }

	}
	
	$('.collapse').on('shown.bs.collapse', function () {
	    $(this).parent().find(".glyphicon-plus").removeClass("glyphicon-plus").addClass("glyphicon-minus");
	}).on('hidden.bs.collapse', function () {
	    $(this).parent().find(".glyphicon-minus").removeClass("glyphicon-minus").addClass("glyphicon-plus");
	});

	
  });
