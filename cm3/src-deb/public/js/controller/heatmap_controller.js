function HeatMapChartData() {
    this.valuesPerParams = [];
    this.xAxisPerParams = [];


    this.formatDate = function (date) {
        var monthNames = [
          "Jan", "Feb", "Mar",
          "Apr", "May", "Jun", "Jul",
          "Aug", "Sep", "Oct",
          "Nov", "Dec"
        ];

        
        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();

        var hh = date.getHours();
        var mm = date.getMinutes();
        var ss = date.getSeconds();

        return hh+":"+mm + ":" + ss +"T";;//day + '-' + monthNames[monthIndex];
    }
    
    this.addParamValue = function (paramName, value, timeEpoch) {

        if (this.valuesPerParams[paramName] == null) {
            this.valuesPerParams[paramName] = [];
            this.xAxisPerParams[paramName] = [];
        }
        this.valuesPerParams[paramName].push(value);
        var d = new Date(timeEpoch);

        this.xAxisPerParams[paramName].push(this.formatDate(d));
    }

    this.addParamValueEx = function (paramName, value, xAxisTimeLabelValue) {

        if (this.valuesPerParams[paramName] == null) {
            this.valuesPerParams[paramName] = [];
            this.xAxisPerParams[paramName] = [];
        }
        this.valuesPerParams[paramName].push(value);

        this.xAxisPerParams[paramName].push(xAxisTimeLabelValue);
    }

    this.getXAxisLabelsForParam = function (paramName) {

        var result = null;
        if (this.xAxisPerParams[paramName] != null) {
            result = this.xAxisPerParams[paramName];
        }

        return result;
    }


    this.getValuesForParam = function (paramName) {

        var result = null;
        if (this.valuesPerParams[paramName] != null) {
            result = this.valuesPerParams[paramName];
        }

        return result;
    }

    this.clear = function () {
        this.xAxisPerParams = [];
        this.valuesPerParams = [];
    }
}

function HeatMapPaneManager()
{
    this.scope = null;
    this.apiService = null;
    this.Init = function (sp, ergastAPIservice) {
        this.scope = sp;
        this.apiService = ergastAPIservice;
        this.Demo();
        this.scope.liveChartData = new HeatMapChartData();
        this.scope.mainGraphChartData = new HeatMapChartData();
    }

    this.addSingleLiveDataParamsToChart = function (dataObject) {
        for (var name in dataObject) {
            this.scope.liveChartData.addParamValue(name, dataObject[name], dataObject.receivedTime);
        }
    }

    this.showLiveDataChartForParam = function (param) {

        if (this.scope.liveChartData != null) {

            var values = this.scope.liveChartData.getValuesForParam(param);
            if (values == null)
            {
                param = param.toUpperCase();
                values = this.scope.liveChartData.getValuesForParam(param);
            }
            var axisX = this.scope.liveChartData.getXAxisLabelsForParam(param);

            this.scope.labelsLiveChart = axisX;
            this.scope.dataLiveChart = [values];
            this.scope.seriesLiveChart = [param];
        }
    }
    
    this.addSingleStatDataParamsToChart = function (dataObject) {

        for (var name in dataObject.statParams) {

            this.scope.mainGraphChartData.addParamValueEx(name, dataObject.statParams[name], dataObject.key);
        }
    }

    this.processStatData = function (statObject) {
        if (statObject.statParams.sum != null && statObject.statParams.count != null) {
            statObject.statParams.average = statObject.statParams.sum / statObject.statParams.count;
            delete statObject.statParams.sum;
        }
    }

    this.getLastDataUpdatedTime = function (logicalDeviceId, callback) {

        this.apiService.getLiveData([logicalDeviceId], 1, 0, null, null, function(liveDataList) {
            if (liveDataList.liveDataPerDeviceId != null) {
                if (liveDataList.liveDataPerDeviceId.length > 0) {
                    if (liveDataList.liveDataPerDeviceId[0].deviceId == logicalDeviceId) {
                        var tempList = liveDataList.liveDataPerDeviceId[0].dataList;
                        if (tempList != null && tempList.length > 0) {
                            callback(tempList[0].data.receivedTime);
                            return;
                        }
                    }
                }
            }
            callback(0);
        });
    }

    this.refreshMainDataChart = function (deviceId, paramName,callBack) {
        // isRefreshLiveDatacompleted = false;
        this.scope.mainGraphChartData.clear();
        var myInstance = this;
        //deviceIdList, limit, offset, timeStart, timeEnd, timeFrame, paramsList, callBack
        this.apiService.getStatDataForDevice([deviceId], 7,
            0, /*$scope.statDataTimeStart*/null, /*$scope.statDataTimeEnd*/null, /*$scope.statTimeFrame*/"daily",
            paramName, function (statDataList) {

                if (statDataList.statPerDeviceId != null) {
                    for (var i = 0; i < statDataList.statPerDeviceId.length; i++) {
                        var tempList = statDataList.statPerDeviceId[i];
                        if (tempList.deviceId == deviceId) {
                            var selectedStatList = null;
                             selectedStatList = tempList.stat.dailyStat;
                           
                            if (selectedStatList != null && selectedStatList.length > 0) {
                                for (var j = 0 ; j < selectedStatList.length; j++) {

                                    myInstance.processStatData(selectedStatList[j]);
                                    myInstance.addSingleStatDataParamsToChart(selectedStatList[j]);
                                    
                                }
                                callBack();
                                break;
                            }
                        }
                    }
                }
            });
    }



    this.refreshLiveDataChart = function (logicalDeviceId,callBack) {

        
        this.scope.liveChartData.clear();

        isRefreshLiveDatacompleted = false;

        var myInstance = this;
        this.apiService.getLiveData([logicalDeviceId], 7, 0, null, null, function (liveDataList) {

            if (liveDataList.liveDataPerDeviceId != null) {
                for (var i = 0; i < liveDataList.liveDataPerDeviceId.length; i++) {

                    if (liveDataList.liveDataPerDeviceId[i].deviceId == logicalDeviceId) {
                        var tempList = liveDataList.liveDataPerDeviceId[i].dataList;

                        if (tempList != null && tempList.length > 0) {
                            for (var j = 0 ; j < tempList.length; j++) {
                                myInstance.addSingleLiveDataParamsToChart(tempList[j].data);
                            }

                            callBack();
                            isRefreshLiveDatacompleted = true;
                            break;
                        }
                    }
                }
            }
        });
    }

    this.showMainChartForParam = function (param) {

        if (this.scope.mainGraphChartData != null) {

            var values = this.scope.mainGraphChartData.getValuesForParam(param);
            if (values == null) {
                param = param.toUpperCase();
                values = this.scope.mainGraphChartData.getValuesForParam(param);
            }
            var axisX = this.scope.mainGraphChartData.getXAxisLabelsForParam(param);

            this.scope.labelsMainChart = axisX;
            this.scope.dataMainChart = [values];
            this.scope.seriesMainChart = [param];
        }
    }

    this.Demo = function () {
        this.scope.colors = [{
            backgroundColor: '#00ffff',
            pointBackgroundColor: '#0062ff',
            pointHoverBackgroundColor: '#0062ff',
            borderColor: '#0062ff',
            pointBorderColor: '#0062ff',
            pointHoverBorderColor: '#0062ff',
            fill: false /* this option hide background-color */
        }];



        this.scope.labelsMainChart = [];//["12", "11", "9", "8", "7", "6", "5"];
        this.scope.seriesMainChart = [];//['Series A'];
        this.scope.dataMainChart = [];/*[
          [65, 59, 80, 81, 56, 55, 40]
        ];*/
        this.scope.optionsMainChart = {
            datasetFill: false,

            scaleShowLabels: false,
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display: false
                    }
                }]
            }
        }


        this.scope.labelsLiveChart = [];//["12", "11", "9", "8", "7", "6", "5"];
        this.scope.seriesLiveChart = [];//['Series A'];
        this.scope.dataLiveChart = [];/*[
          [65, 59, 80, 81, 56, 55, 40]
        ];*/
        this.scope.optionsLiveChart = {
            datasetFill : false,

            scaleShowLabels: false,
            scales: {
            xAxes: [{
                gridLines: {
                    display: false
                }
            }],
            yAxes: [{
                gridLines: {
                    display: false
                }
            }]
        }
        }
    }

}
angular.module('F1FeederApp.controllers').

controller('heatmapController', function heatmapController($scope, $sce, $routeParams, $location, $interval, $timeout, $localStorage, ergastAPIservice) {
    $scope.id = $routeParams.id;

    var paramChartManager = new HeatMapPaneManager();
    paramChartManager.Init($scope, ergastAPIservice);
        
    $scope.deviceSpec = {};
    $scope.devices = [];
    $scope.deviceIds = [];
    $scope.deviceCount = 0;
    $scope.deviceParams = [];
    $scope.deviceDisplayParamsTop = [];
    $scope.deviceDisplayParamsRight = [];
    $scope.displayParamsStartIndex = 0;
    $scope.deviceLocation = "";
    $scope.primaryParam = null;
    $scope.selectedDeviceInfo = null;
    $scope.selectedRightPanelIndex = 0;
    $scope.controlButtonIndex = 1;
    $scope.lastUpdateTime = "23-Mar-2017 12:55 PM";
    $scope.heatmap = {
        center: {
            latitude: 21.2514,//10.016033,
            longitude: 81.6296 //76.338835
        },
        zoom: 12,
        deviceMarkers: [],
        control: {},
        heatLayerCallback: function (layer) {
            //set the heat layers backend data
            $scope.qualityHeatLayer = new QualityHeatMapLayer(layer);
            updateAreaRadius();
            $scope.qualityHeatLayer.updateHeatMap();
            console.log('Callback called!!!');           
        },
        showHeat: true,
        events: {
            zoom_changed: function () {
                updateAreaRadius();
            }
        }
    };
    var maxTopParamsDisplayCount = 5;
    var maxRightParamsDisplayCount = 8;
    var primaryParamGradientSet = [];
    var primaryParamMaxWeightValue = 0;
    var stopUpdateTimer = null;

    var updateAreaRadius = function () {
        var map = $scope.heatmap.control.getGMap();
        console.log('Zoom changed: ', map.getZoom(), map.getCenter().lat());
        var MetersPerPixel = 156543.03392 * Math.cos(map.getCenter().lat() * Math.PI / 180) / Math.pow(2, map.getZoom());
        console.log('Meters Per Pixels: ', MetersPerPixel);
        $scope.qualityHeatLayer.updateRadius(MetersPerPixel);
    }

    $scope.SkipValidation = function (value) {
        return $sce.trustAsHtml(value);
    };    

    $(window).on("resize.doResize", function () {
        $scope.$apply(function () {
            //do something to update current scope based on the new innerWidth and let angular update the view.
            $timeout(resetDisplayParams, 300);            
        });
    });

    $scope.$on("$destroy", function () {
        $(window).off("resize.doResize"); //remove the handler added earlier
    });     

    var resetDisplayParams = function () {
        setupTopDisplayParams($scope.deviceParams);
    }

    var updateMaxTopParamsDisplayCount = function () {
        //alert(window.innerWidth);
        maxTopParamsDisplayCount = parseInt((window.innerWidth - 300) / 210);
        //alert(maxTopParamsDisplayCount);
    }

    $scope.backToHomeClicked = function() {
        $location.path('/home');
    }

    var updateDeviceSpec = function (specId) {

        if ($scope.deviceSpec[specId] != null)
            return;

        ergastAPIservice.getDeviceSpec(specId, function (err, spec) {
            if (!err && spec != null) {
                $scope.deviceSpec[specId] = spec;
                console.log('device spec - ' + specId + ': ' + spec);
            }
        });
    }

    var updateDeviceInfo = function (callback) {
        ergastAPIservice.getDeviceCount("", function (count) {
            $scope.deviceCount = count;
            console.log('device count: ', count);

            var counter = 0;
            for (var i = 0; i < count; i++) {

                ergastAPIservice.getDeviceAt(null, i, function (deviceInfo) {
                    if (deviceInfo != null) {

                        if (deviceInfo.subType != null)
                            updateDeviceSpec(deviceInfo.subType);

                        $scope.deviceIds.push(deviceInfo.deviceId);
                        $scope.devices.push(
                        {
                            deviceId: deviceInfo.deviceId,
                            logicalDeviceId: deviceInfo.logicalDeviceId,
                            devFamily: deviceInfo.devFamily,
                            subType: deviceInfo.subType,
                            tag: deviceInfo,
                            city: deviceInfo.location != null ? deviceInfo.location.city : "",
                            latitude: deviceInfo.location != null ? parseFloat(deviceInfo.location.latitude) : 0,
                            longitude: deviceInfo.location != null ? parseFloat(deviceInfo.location.longitude) : 0,
                            customerName: deviceInfo.customerName
                        });

                        addMarkerToMap(deviceInfo);
                        counter++;
                        if (counter == count)
                            callback();
                    }
                });
            }

            if (count == 0)
                callback();
        });
    }

    var getHeatInfo = function (callback) {
        var v = new Date();
        var utc = new Date(v.getFullYear(), v.getMonth(), v.getDate());
        //var diffTimeZone = utc.getTimezoneOffset() * 60000;
        var ToGmt = utc.valueOf();//- diffTimeZone;
        var deviceHeatInfo = {};

        console.log('device ids', $scope.deviceIds);
        ergastAPIservice.getStatDataForDevice($scope.deviceIds, null, 0, null, null, "daily", null, function (data) {
            console.log('getStatDataForDevice', data);
            if (data != null && data.statPerDeviceId != null) {
                for (var i = 0; i < data.statPerDeviceId.length; i++) {
                    var dailyStat = data.statPerDeviceId[i].stat.dailyStat;
                    var paramsInfo = getHeatForAllParams(data.statPerDeviceId[i].deviceId, dailyStat);
                    deviceHeatInfo[data.statPerDeviceId[i].deviceId] = paramsInfo;
                    console.log('params info for one device', paramsInfo);
                }
            }

            callback(deviceHeatInfo);
        })
    }

    var getHeatForAllParams = function (deviceId, dailyStat) {
        console.log('heat info for all params', deviceId, dailyStat);
        var paramsInfo = [];
        var aqi = null;
        if (dailyStat != null) {

            var deviceInfoList = $scope.devices.filter(function (dev) {
                return dev.deviceId == deviceId;
            });

            if (deviceInfoList == null || deviceInfoList.length <= 0)
                return paramsInfo;

            var deviceInfo = deviceInfoList[0];

            console.log("device info:", deviceInfo);

            var paramDefinitions = null;
            if ($scope.deviceSpec[deviceInfo.subType] != null) {
                paramDefinitions = $scope.deviceSpec[deviceInfo.subType].paramDefinitions;
            }
            else if (deviceInfo.tag != null && deviceInfo.tag.paramDefinitions != null) {
                paramDefinitions = deviceInfo.tag.paramDefinitions;
            }
           
            if(paramDefinitions != null) {

                for (var j = 0; j < paramDefinitions.length; j++) {

                    var paramDefinition = paramDefinitions[j];
                    var limits = paramDefinition.limits;

                    var result = dailyStat.filter(function (v) {
                        return v.paramName === paramDefinition.paramName; // Filter out the appropriate one
                    })
                    if (result != null && result.length > 0) {

                        var dailyStatParam = result[0];
                        // this item can't be shown in UI
                        if (paramDefinition.isDisplayEnabled != null && paramDefinition.isDisplayEnabled == false)
                            continue;
                        if (paramDefinition.paramName == "receivedTime")
                            continue;

                        //if (paramDefinition.paramName == "AQI")
                        //    dailyStatParam.statParams.sum = dailyStatParam.statParams.count * Math.floor((Math.random() * 500) + 1);

                        var valuePrecision = paramDefinition.valuePrecision != null ? paramDefinition.valuePrecision : 2;
                        var averageValueLimitIndex = getParamValueLimitIndex(limits, dailyStatParam.statParams.sum / dailyStatParam.statParams.count);
                        var minValueLimitIndex = getParamValueLimitIndex(limits, dailyStatParam.statParams.min);
                        var maxValueLimitIndex = getParamValueLimitIndex(limits, dailyStatParam.statParams.max);

                        var params = {
                            average: {
                                value: (dailyStatParam.statParams.sum / dailyStatParam.statParams.count).toFixed(valuePrecision),
                                color: averageValueLimitIndex >= 0 ? limits[averageValueLimitIndex].color : "888888",
                                description: averageValueLimitIndex >= 0 ? limits[averageValueLimitIndex].description : "Unknown",
                                valueWeight: averageValueLimitIndex + 1
                            },
                            min: {
                                value: dailyStatParam.statParams.min.toFixed(valuePrecision),
                                color: minValueLimitIndex >= 0 ? limits[minValueLimitIndex].color : "888888",
                                description: minValueLimitIndex >= 0 ? limits[minValueLimitIndex].description : "Unknown",
                                valueWeight: minValueLimitIndex + 1
                            },
                            max: {
                                value: dailyStatParam.statParams.max.toFixed(valuePrecision),
                                color: maxValueLimitIndex >= 0 ? limits[maxValueLimitIndex].color : "888888",
                                description: maxValueLimitIndex >= 0 ? limits[maxValueLimitIndex].description : "Unknown",
                                valueWeight: maxValueLimitIndex + 1
                            },
                            count: dailyStatParam.statParams.count
                        }
                        copyDeviceParamsFromDefinition(params, paramDefinition, limits);

                        paramsInfo.push(params);
                    }
                }
            }
        }

        return paramsInfo;
    }

    var getParamValueLimitIndex = function (limits, value) {
        if (limits != null && limits.length > 0 && value != null) {
            for (var i = 0; i < limits.length; i++) {
                if (limits[i].min != null && limits[i].max != null && value >= limits[i].min && value < limits[i].max)
                    return i;
                if (limits[i].min != null && limits[i].max == null && value >= limits[i].min)
                    return i;
                if (limits[i].min == null && limits[i].max != null && value < limits[i].max)
                    return i;
            }
        }

        return -1;
    }

    var addMarkerToMap = function (deviceInfo) {
        if ($scope.heatmap != null && $scope.heatmap.deviceMarkers != null &&
            deviceInfo != null && deviceInfo.location != null) {
            var marker = new google.maps.Marker({
                id: deviceInfo.deviceId,
                position: new google.maps.LatLng(parseFloat(deviceInfo.location.latitude), parseFloat(deviceInfo.location.longitude)),
                tag: deviceInfo,
                title: deviceInfo.location.landMark + ", " + deviceInfo.location.city,
                icon: { url: 'images/map-marker-normal-small.png', scaledSize: { width: 30, height: 50 } },
                coords: {
                    latitude: parseFloat(deviceInfo.location.latitude),
                    longitude: parseFloat(deviceInfo.location.longitude)
                }
            });
            $scope.heatmap.deviceMarkers.push(marker);
        }
    }

    function QualityHeatMapLayer(heatLayer) {

        this.heatMapLayer = heatLayer;

        this.updateHeatMap = function () {

            var heatData = [];
            heatData = getPoints();
            var pointArray = new google.maps.MVCArray(heatData);
            var colorGradients = primaryParamGradientSet.slice(0, primaryParamMaxWeightValue + 1);
            this.heatMapLayer.setData(pointArray);
            this.heatMapLayer.setOptions({
                dissipating: true,
                maximumIntensity: primaryParamMaxWeightValue,
                gradient: colorGradients
            });
        }

        this.updateRadius = function (scaleMetersPerPixel) {
            var areaRadius = Math.max(10, 1000 / scaleMetersPerPixel);
            console.log('Area Radius: ', areaRadius);
            console.log();
            this.heatMapLayer.setOptions({
                radius: areaRadius
            });
        }

        function shadeColor2(color, percent) {
            var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
            return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
        }

        var getPoints = function () {

            primaryParamGradientSet = [];
            primaryParamMaxWeightValue = 0;
            var heatData = [];
            for (var i = 0; i < $scope.deviceIds.length; i++) {
                var deviceInfo = $scope.devices.filter(function (dev) {
                    return dev.deviceId == $scope.deviceIds[i];
                });

                if (deviceInfo == null || deviceInfo.length <= 0)
                    continue;

                var deviceLocation = new google.maps.LatLng(deviceInfo[0].latitude, deviceInfo[0].longitude);
                var primaryParamInfoList = $scope.deviceHeatInfo[deviceInfo[0].deviceId].filter(function(param) {
                    return param.isPrimary == true;
                });

                if (primaryParamInfoList != null && primaryParamInfoList.length > 0) {

                    if (primaryParamGradientSet.length == 0) {
                        primaryParamGradientSet = updateGradient(deviceInfo[0].tag.paramDefinitions, primaryParamInfoList[0].paramName);
                    }

                    heatData.push({ location: deviceLocation, weight: primaryParamInfoList[0].average.valueWeight });
                    if (primaryParamInfoList[0].average.valueWeight > primaryParamMaxWeightValue)
                        primaryParamMaxWeightValue = primaryParamInfoList[0].average.valueWeight;

                    /*var options = {
                        strokeColor: shadeColor2(primaryParamInfoList[0].average.color, .1),
                        strokeOpacity: 1,
                        strokeWeight: 10,
                        fillColor: '#' + primaryParamInfoList[0].average.color,
                        fillOpacity: 1,
                        map: $scope.heatmap.control.getGMap(),
                        center: deviceLocation,
                        radius: 300
                    };

                    circle = new google.maps.Circle(options);*/

                }
            }

            if (primaryParamGradientSet.length == 0) {
                primaryParamGradientSet.push('rgba(0, 255, 0, 0.3)');
                primaryParamGradientSet.push('rgba(255, 0, 0, 0.3)');
                primaryParamMaxWeightValue = 1;
            }

            //heatData.push({ location: new google.maps.LatLng(10.015526, 76.360380), weight: 4 });
            //heatData.push({ location: new google.maps.LatLng(10.055526, 76.330380), weight: 4 });
            //heatData.push({ location: new google.maps.LatLng(10.000526, 76.320380), weight: 6 });

            return heatData;
        }

        var updateGradient = function (paramDefinitions, paramName) {

            var gradient = ['rgba(0, 255, 0, 0.3)'];

            var paramDefList = paramDefinitions.filter(function (paramDef) {
                return paramDef.paramName == paramName;
            });
            
            if (paramDefList.length == 0 || paramDefList[0].limits == null || paramDefList[0].limits.length == 0)
                return gradient;

            for (var i = 0; i < paramDefList[0].limits.length; i++) {
                gradient.push('#' + paramDefList[0].limits[i].color);
            }
           
            return gradient;
        }

        var getTestPoints = function () {
            var heatData = [
                { location: new google.maps.LatLng(23.220551, 72.655368), weight: 0 },
                { location: new google.maps.LatLng(23.220745, 72.654586), weight: 1 },
                { location: new google.maps.LatLng(23.220842, 72.653688), weight: 2 },
                { location: new google.maps.LatLng(23.220919, 72.652815), weight: 3 },
                { location: new google.maps.LatLng(23.220992, 72.652112), weight: 4 },
                { location: new google.maps.LatLng(23.221100, 72.651461), weight: 5 },
                { location: new google.maps.LatLng(23.221206, 72.650829), weight: 6 },
                { location: new google.maps.LatLng(23.221273, 72.650324), weight: 7 },
                { location: new google.maps.LatLng(23.221316, 72.650023), weight: 8 },
                { location: new google.maps.LatLng(23.221357, 72.649794), weight: 9 },
                { location: new google.maps.LatLng(23.221371, 72.649687), weight: 10 }
            ];

            return heatData;
        }
    };   

    var selectDevice = function (deviceId) {
        var deviceInfoList = $scope.devices.filter(function (dev) {
            return dev.deviceId == deviceId;
        });

        var selDeviceInfo = null;
        if (deviceInfoList.length > 0)
            selDeviceInfo = deviceInfoList[0];
        else if ($scope.devices.length > 0)
            selDeviceInfo = $scope.devices[0];

        if (selDeviceInfo == null)
            return;

        $scope.deviceParams = $scope.deviceHeatInfo[selDeviceInfo.deviceId];
        if ($scope.deviceParams == null || $scope.deviceParams.length <= 0)
            $scope.deviceParams = setupDefaultParams(selDeviceInfo);

        $scope.deviceLocation = selDeviceInfo.tag.location.landMark + ", " + selDeviceInfo.tag.location.city;
        $scope.selectedDeviceId = selDeviceInfo.deviceId;
        $scope.selectedDeviceInfo = selDeviceInfo;

        if ($scope.heatmap != null && $scope.heatmap.deviceMarkers != null) {
            for (var i = 0; i < $scope.heatmap.deviceMarkers.length; i++) {
                var thisMarker = $scope.heatmap.deviceMarkers[i];
                thisMarker.icon = { url: (thisMarker.id == selDeviceInfo.deviceId ? 'images/map-marker-selected-small.png' : 'images/map-marker-normal-small.png'), scaledSize: { width: 30, height: 50 } };
            }
        }
        updateLastUpdatedTimeStamp(selDeviceInfo.logicalDeviceId);
        setupDisplayBars($scope.deviceParams);
    }

    var updateLastUpdatedTimeStamp = function(logicalDeviceId) {
        paramChartManager.getLastDataUpdatedTime(logicalDeviceId, function (dateTime) {
            if (dateTime == 0)
                $scope.lastUpdateTime = "--";
            else {
                var dateTime = new Date(dateTime);
                var monthNames = [
                 "Jan", "Feb", "Mar",
                 "Apr", "May", "Jun", "Jul",
                 "Aug", "Sep", "Oct",
                 "Nov", "Dec"
                ];

                var day = dateTime.getDate();
                var monthIndex = dateTime.getMonth();
                var year = dateTime.getFullYear();
                var hh = dateTime.getHours();
                var mm = dateTime.getMinutes();
                var ss = dateTime.getSeconds();
                var ampm = hh >= 12 ? 'PM' : 'AM';
                hh = hh % 12;
                hh = hh ? hh : 12; // the hour '0' should be '12'
                day = day < 10 ? '0' + day : day;
                hh = hh < 10 ? '0' + hh : hh;
                mm = mm < 10 ? '0' + mm : mm;
                ss = ss < 10 ? '0' + ss : ss;
                $scope.lastUpdateTime = day + '-' + monthNames[monthIndex] + '-' + year + ' ' + hh + ":" + mm + ":" + ss + ' ' + ampm;
            }
        });
    }

    var setupDisplayBars = function (deviceParams) {

        setupTopDisplayParams(deviceParams);
        setupRightDisplayParams(deviceParams);
        setupPrimaryParamDisplay(deviceParams);

        for (var item = 0; item < $scope.deviceDisplayParamsTop.length; ++item) {
            // Activate Carousel
            $("#carousel" + item).carousel("pause");
            $("#carousel" + item).carousel(0);
            $("#carousel" + item).carousel("cycle");
        }
    }

    var setupTopDisplayParams = function (deviceParams) {
        updateMaxTopParamsDisplayCount();
        var i = 0;
        $scope.deviceDisplayParamsTop = [];
        for (i = 0; i < deviceParams.length; i++) {
            var displayItems = [{
                value: deviceParams[i].average,
                type: "AVG"
            },
            {
                value: deviceParams[i].min,
                type: "MIN"
            },
            {
                value: deviceParams[i].max,
                type: "MAX"
            }
            ];

            for (var item = 0; item < displayItems.length; ++item) {
                copyDisplayParamAttributes(displayItems[item], deviceParams[i]);
            }

            if ($scope.deviceDisplayParamsTop[i % maxTopParamsDisplayCount] == null)
                $scope.deviceDisplayParamsTop[i % maxTopParamsDisplayCount] = displayItems;
            else {
                for (var item = 0; item < displayItems.length; ++item) {
                    $scope.deviceDisplayParamsTop[i % maxTopParamsDisplayCount].push(displayItems[item]);
                }
            }            
        }

        var maxItemsCount = 0;
        for (i = 0; i < $scope.deviceDisplayParamsTop.length; i++) {
            if ($scope.deviceDisplayParamsTop[i] != null && $scope.deviceDisplayParamsTop[i].length > maxItemsCount)
                maxItemsCount = $scope.deviceDisplayParamsTop[i].length;
        }

        if (maxItemsCount > 0) {
            $interval.cancel(stopUpdateTimer);
            stopUpdateTimer = $interval(update, maxItemsCount * 5000);
        }
    }

    var setupRightDisplayParams = function (deviceParams) {
        $scope.deviceDisplayParamsRight = [];

        var liveDataList = deviceParams.filter(function (param) {
            return param.needsLiveData == true;
        });

        for (i = 0; i < maxRightParamsDisplayCount && i < liveDataList.length; i++) {
            $scope.deviceDisplayParamsRight[i] = liveDataList[i];
        }

        if ($scope.deviceDisplayParamsRight.length > $scope.selectedRightPanelIndex &&
            $scope.selectedRightParam != null &&
            $scope.selectedRightParam.paramName == $scope.deviceDisplayParamsRight[$scope.selectedRightPanelIndex].paramName) {
            $scope.rightParamClicked($scope.deviceDisplayParamsRight[$scope.selectedRightPanelIndex], $scope.selectedRightPanelIndex);
        }
        else if ($scope.deviceDisplayParamsRight.length > 0)
            $scope.rightParamClicked($scope.deviceDisplayParamsRight[0], 0);
    }

    var copyDisplayParamAttributes = function (displayItem, deviceParams) {
        displayItem.paramName = deviceParams.paramName;
        displayItem.displayName = deviceParams.displayName;
        displayItem.displayNameHtml = deviceParams.displayNameHtml;
        displayItem.displayImage = deviceParams.displayImage;
        displayItem.hasLimits = deviceParams.hasLimits;
        displayItem.isPrimary = deviceParams.isPrimary;
        displayItem.limits = deviceParams.limits;
        displayItem.unit = deviceParams.unit;
        displayItem.unitDisplay = deviceParams.unitDisplay;
    }

    var setupPrimaryParamDisplay = function (deviceParams) {

        // Update primary parameter
        var primaryParamsList = deviceParams.filter(function (param) {
            return param.isPrimary == true;
        });

        var primaryParam = null;
        if (primaryParamsList.length > 0)
            primaryParam = primaryParamsList[0];
        $scope.primaryParam = primaryParam;

        if ($scope.primaryParam != null) {
            paramChartManager.refreshMainDataChart($scope.selectedDeviceId, $scope.primaryParam.paramName, function () {
                paramChartManager.showMainChartForParam("average");
            });
        }
    }

    var setupDefaultParams = function (deviceInfo) {

        var defaultDeviceParams = [];
        var paramDefinitions = null;
        if ($scope.deviceSpec[deviceInfo.subType] != null) {
            paramDefinitions = $scope.deviceSpec[deviceInfo.subType].paramDefinitions;
        }
        else if (deviceInfo.tag != null && deviceInfo.tag.paramDefinitions != null) {
            paramDefinitions = deviceInfo.tag.paramDefinitions;
        }

        for (var i = 0; i < paramDefinitions.length; i++) {
            if (!paramDefinitions[i].isDisplayEnabled)
                continue;
            if (paramDefinitions[i].paramName == "receivedTime")
                continue;

            var paramDefinition = paramDefinitions[i];
            var params = {
                average: {
                    value: '--',
                    color: "888888",
                    description: "--",
                    valueWeight: 0
                },
                min: {
                    value: '--',
                    color: "888888",
                    description: "--",
                    valueWeight: 0
                },
                max: {
                    value: '--',
                    color: "888888",
                    description: "--",
                    valueWeight: 0
                },
                count: 0
            };
            copyDeviceParamsFromDefinition(params, paramDefinition, paramDefinition.limits);

            defaultDeviceParams.push(params);           
        }

        return defaultDeviceParams;
    }

    var copyDeviceParamsFromDefinition = function (deviceParams, paramDefinition, limits) {
        deviceParams.paramName = paramDefinition.paramName;
        deviceParams.displayName = paramDefinition.displayName;
        deviceParams.displayNameHtml = paramDefinition.displayNameHtml;
        deviceParams.displayImage = paramDefinition.displayImage;
        deviceParams.hasLimits = paramDefinition.hasLimits;
        deviceParams.isPrimary = paramDefinition.isPrimary;
        deviceParams.limits = limits;
        deviceParams.unit = paramDefinition.unit;
        deviceParams.unitDisplay = paramDefinition.unitDisplayHtml;
        deviceParams.needsLiveData = paramDefinition.needsLiveData;
    }

    $scope.deviceSelected = function (m) {
        selectDevice(m.id);
    }

    $scope.homeButtonClicked = function () {
        $location.path("/home");
    }

    $scope.logoutButtonClicked = function () {
        console.log('Logging out');
        $location.path('/login');
        console.log($localStorage.loggedIn);
        delete $localStorage.loggedIn;
        console.log($localStorage.loggedIn);
    }

    $scope.overviewButtonClicked = function () {
    }

    $scope.selectedRightParam = null;
    $scope.rightParamClicked = function (param, index) {
        $scope.selectedRightParam = param;
        $scope.selectedRightPanelIndex = index;
        paramChartManager.refreshLiveDataChart($scope.selectedDeviceInfo.logicalDeviceId, function () {
            paramChartManager.showLiveDataChartForParam(param.paramName);
        });
    }

    var update = function () {
        console.log('updating heatmap');
        getHeatInfo(function (deviceHeatInfo) {

            $scope.deviceHeatInfo = deviceHeatInfo;

            /*console.log('Heat Info count: ', Object.keys(deviceHeatInfo).length);
            for (var i = 0; i < $scope.deviceIds.length; i++) {

                console.log($scope.deviceIds[i]);
                var paramInfo = deviceHeatInfo[$scope.deviceIds[i]];
                console.log('Heat info: ', paramInfo);
            }*/

            selectDevice($scope.selectedDeviceId);
            if ($scope.qualityHeatLayer != null)
                $scope.qualityHeatLayer.updateHeatMap();
        });
    }

    updateDeviceInfo(function () {
        update();
    });

    stopUpdateTimer = $interval(update, 15000); // every 15 seconds
});

