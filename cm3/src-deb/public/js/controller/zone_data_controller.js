//[
//{
//    "city": "thrissur",
//    "zone": "",
//    "devices": [
//    {
//        "deviceId": "noLoc2",
//        "devFamily": "Air"
//    },
//    {
//        "deviceId": "g3",
//        "devFamily": "Air"
//    },
//    {
//        "deviceId": "g2",
//        "devFamily": "Air"
//    }
//    ]
//}
///]



angular.module('F1FeederApp.controllers').

  controller('zone_data_controller', function ($scope, $routeParams, $location, ergastAPIservice) {


      this.zoneDataProcessor = null;

      $scope.zoneValuesPerClass = {
        };

      $scope.zoneTab = 1;
      $scope.selectCity = function (cityName) {
          $scope.selectedCity = cityName;
      }

      $scope.selectZone = function (zone) {
         

          $scope.selectedZone = zone;
      }
      $scope.selectZone("[None]");

      $scope.daysSelected = "1 Day";
      $scope.selectDays = function (days) {
          $scope.daysSelected = days;
      }

      $scope.setZoneViewTab = function (tab) {
          $scope.zoneTab = tab;
      }

      $scope.isZoneTabSelected = function (tabNum)
      {
          return $scope.zoneTab === tabNum;
      };

      var getSelectedDuration = function () {
          var numberOFDays = 1;
          if ($scope.daysSelected == "1 Day")
              numberOFDays = 1;
          else if ($scope.daysSelected == "7 Day")
              numberOFDays = 7;
          else if ($scope.daysSelected == "14 Day")
              numberOFDays = 14;
          
          return numberOFDays;
      }
      var setTodaysDateInUI = function () {
          var today = new Date();
          function minTwoDigits(n) {
              return (n < 10 ? '0' : '') + n;
          }
          $scope.dateZoneStart = today.getFullYear() + "-" + minTwoDigits((today.getMonth() + 1)) + "-" + minTwoDigits(today.getDate()); //2017-04-06

      }

      $scope.buttonZoneProcessStartClick = function () {
          if (zoneDataProcessor != null) {

              if ($scope.selectedCity == null) {
                  alert("Please select a City to start processing.");
                  return;
              }
              $scope.zoneProcessingCompleted = false;

                    
              var dates = $scope.dateZoneStart.split('-');
              var y = Number(dates[0]);
              var m = Number(dates[1]);
              var d = Number(dates[2]);

              //year-m-date
              var today = new Date();
              today.setYear(y);
              today.setMonth(m - 1);
              today.setDate(d);
              today.setHours(0, 0, 0, 0);
              var startDateEpoch = today.valueOf();


              var selZone = $scope.selectedZone;
              if (selZone == "[None]")
                  selZone = null;

              var numberOfDays = getSelectedDuration();

              zoneDataProcessor.processData($scope.selectedCity, selZone, startDateEpoch,numberOfDays, function () {


                  var res = zoneDataProcessor.getResult();
                  updateUI(res);
                  $scope.zoneProcessingCompleted = true;
              });
          }

      }


      $scope.zoneChartData = {

          AFMEthernet: {

              paramList: ["Temperature", "CO"],
              graphModel: {
                  valueList: [10, 20, 30],
                  axisLabels : ["1","2","3"]
              }
          },

          AFMEthernet1: {

          paramList: ["Temperature", "CO"],
          graphModel: {
              valueList: [100, 20, 30],
              axisLabels : ["1","2","3"]
          }
      }
      }

      /*
       $scope.zoneValuesPerClass = {
          AFMEthernet: 
              [
                { paramName: "Temperature", min: 100, max: 100, average: 200 },
                { paramName: "Temperature", min: 100, max: 100, average: 200 },
              ],

          AFMEthernet1:
              [
                { paramName: "Humidity", min: 100, max: 100, average: 200 },
                { paramName: "Humidity", min: 100, max: 100, average: 200 },
              ]


        };
      
      
      */

      $scope.selectZoneChartFunc = function (graphData,funcType) {
          graphData.selectedFunc = funcType;

          $scope.seletChartParameter(graphData.selectedParam, graphData.selectedClassName, graphData);
      }

      $scope.seletChartParameter = function (selectedParam, className,graphData) {

          var paramName = selectedParam.paramName;
          graphData.selectedParamDispName = selectedParam.dispName;
          graphData.selectedParam = selectedParam;
          graphData.selectedClassName = className;

          var statFunc = graphData.selectedFunc;

          var zoneRes = zoneDataProcessor.getResult();
          if (zoneRes[className] != null) {


              var zoneChartDataProcessor = new ChartDataProcessor();

              var xAxisLabel = [];
              var values = [];

              var zoneResPerDays = zoneRes[className];
              for (var i = 0; i < zoneResPerDays.length; i++) {
                  if (zoneResPerDays[i].stat != null && zoneResPerDays[i].stat[paramName]!= null)
                      zoneChartDataProcessor.addParamValue(paramName, zoneResPerDays[i].stat[paramName][statFunc], zoneResPerDays[i].epoch);

              }

              $scope.zoneChartData[className].graphModel.valueList = zoneChartDataProcessor.getValuesForParam(paramName);
              $scope.zoneChartData[className].graphModel.axisLabels = zoneChartDataProcessor.getXAxisLabelsForParam(paramName);
          }
      }

      var updateUI = function (zoneData) {

          $scope.zoneValuesPerClass = {};
          $scope.zoneChartData = {};
          var zoneChartData = {};
          var selectedDefaultChart = false;
          for (var deviceClass in zoneData) {
              var zoneDataPerClass = [];
              $scope.zoneValuesPerClass[deviceClass] = zoneDataPerClass;
              
              
              var tempDefList = zoneDataProcessor.getParamDefinitionForClass(deviceClass);
              var chartParamList = [];
              for (var t = 0; t < tempDefList.length; t++) {
                  if (tempDefList[t].isDisplayEnabled)
                      chartParamList.push({ paramName: tempDefList[t].paramName, dispName: tempDefList[t].displayName });
              }
              zoneChartData[deviceClass] = {};
              zoneChartData[deviceClass].paramList = chartParamList;
              zoneChartData[deviceClass].graphModel = {};
              zoneChartData[deviceClass].selectedFunc = "avg";
             
              var infoList = zoneData[deviceClass];
              for (var j = 0; j < infoList.length; j++) {

                  if (infoList[j].stat != null) {
                      var epochTime = infoList[j].epoch;
                      var d = new Date(epochTime);

                      var paramStats = infoList[j].stat;
                      for (var parItem in paramStats) {

                          var defItem = zoneDataProcessor.getParamDefinitionForItem(deviceClass, parItem);
                          if (!defItem.isDisplayEnabled)
                              continue;

                          zoneDataPerClass.push({
                              paramName: defItem.displayName,
                              unit:defItem.unit,
                              min: paramStats[parItem].min.toFixed(2),
                              max: paramStats[parItem].max.toFixed(2),
                              average: paramStats[parItem].avg.toFixed(2),
                              time:d.getDate()+"/"+(d.getMonth()+1)+"/"+d.getFullYear()
                          });
                      }
                  }
              }
          }

          $scope.zoneChartData = zoneChartData;
          if (Object.keys(zoneChartData).length > 0){

              for (devClass in $scope.zoneChartData)
              {

                  $scope.seletChartParameter($scope.zoneChartData[devClass].paramList[0], devClass, $scope.zoneChartData[devClass]);
              }
            
          }
      }

      var zoneDataProcessor = null;

      $scope.classNameToSubType = function (className) {
          if (className == "EnvSensorDevice")
              return "ESDEL001";

          return className;
      }


      this.initPage = function () {

          setTodaysDateInUI();
          zoneDataProcessor = null;
          var myInstance = this;
          ergastAPIservice.getDeviceDeploymentInfo(null, null, function (err, deployment) {

              
              if (!err) {
                  zoneDataProcessor = new ZoneDataProcessor(deployment, ergastAPIservice);
                  $scope.availableCities = zoneDataProcessor.getAllCityList();
                  $scope.availableZones = zoneDataProcessor.getAllZoneList();
              }
          });
      }

      this.initPage();

      $('.list-group.checked-list-box .list-group-item').each(function () {

          // Settings
          var $widget = $(this),
              $checkbox = $('<input type="checkbox" class="hidden" />'),
              color = ($widget.data('color') ? $widget.data('color') : "primary"),
              style = ($widget.data('style') == "button" ? "btn-" : "list-group-item-"),
              settings = {
                  on: {
                      icon: 'glyphicon glyphicon-check'
                  },
                  off: {
                      icon: 'glyphicon glyphicon-unchecked'
                  }
              };

          $widget.css('cursor', 'pointer')
          $widget.append($checkbox);

          // Event Handlers
          $widget.on('click', function () {
              $checkbox.prop('checked', !$checkbox.is(':checked'));
              $checkbox.triggerHandler('change');
              updateDisplay();
          });
          $checkbox.on('change', function () {
              updateDisplay();
          });


          // Actions
          function updateDisplay() {
              var isChecked = $checkbox.is(':checked');

              // Set the button's state
              $widget.data('state', (isChecked) ? "on" : "off");

              // Set the button's icon
              $widget.find('.state-icon')
                  .removeClass()
                  .addClass('state-icon ' + settings[$widget.data('state')].icon);

              // Update the button's color
              if (isChecked) {
                  $widget.addClass(style + color + ' active');
              } else {
                  $widget.removeClass(style + color + ' active');
              }
          }

          // Initialization
          function init() {

              if ($widget.data('checked') == true) {
                  $checkbox.prop('checked', !$checkbox.is(':checked'));
              }

              updateDisplay();

              // Inject the icon if applicable
              if ($widget.find('.state-icon').length == 0) {
                  $widget.prepend('<span class="state-icon ' + settings[$widget.data('state')].icon + '"></span>');
              }
          }
          init();
      });

      $('#get-checked-data').on('click', function (event) {
          event.preventDefault();
          var checkedItems = {}, counter = 0;
          $("#check-list-box li.active").each(function (idx, li) {
              checkedItems[counter] = $(li).text();
              counter++;
          });
          $('#display-json').html(JSON.stringify(checkedItems, null, '\t'));
      });
  });