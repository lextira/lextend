function LiveCSVDataGenerator() {

    this.addColumnHeaderForParam = function (colName) {
        return colName;
    }
    this.generateCSVData = function (paramNames, deviceId, rawDataForCSV,addHeader) {

        //  var paramNames = ["CO", "PM2P5", "PM10"];
        var CSVData = "";
        if (addHeader) {
            CSVData = "Date,Location,";
            CSVData += this.addColumnHeaderForParam(paramNames[0]);
            for (var k = 1; k < paramNames.length; k++) {
                CSVData += "," + this.addColumnHeaderForParam(paramNames[k]);
            }
        }

        if (rawDataForCSV != null) {
            for (var dateName in rawDataForCSV) {
                CSVData += "\r\n";
                var tempDate = dateName.replace(".", "-").replace(".", "-");
                CSVData += tempDate + ",";
                CSVData += deviceId + ",";
                var colInfo = rawDataForCSV[dateName];
                if (colInfo[paramNames[0].toUpperCase()] != null) {
                    CSVData += colInfo[paramNames[0].toUpperCase()].toString();
                }
                else {
                    CSVData += '-';
                }
                for (var j = 1; j < paramNames.length; j++) {

                    var keyName = paramNames[j].toUpperCase();
                    if (colInfo[keyName] != null) {
                        CSVData += "," + colInfo[keyName].toString();
                    }
                    else {
                        CSVData += ",-";
                    }
                }
                //CSVData += "\r\n";
            }
        }
        return CSVData;
        //    window.URL = window.URL || window.webkitURL;

        //    var data = 'some data here...',
        //blob = new Blob([data], { type: 'text/plain' }),
        //u//rl = $window.URL || $window.webkitURL;

        //    var blob = new Blob([CSVData], { type: 'text/plain' });
        //    $scope.linkDownloadStat = window.URL.createObjectURL(blob);
    }
}

function StatCSVDataGenerator()
{
    this.addColumnHeaderForParam = function (colName) {
        //console.log("COLUMN NAME", colName);
        return "Max " + colName + ", Min " + colName + ", Avg " + colName;
    }
    this.generateCSVData = function (paramNames,deviceId,rawDataForCSV) {

      //  var paramNames = ["CO", "PM2P5", "PM10"];
        var CSVData = "Date,Location,";
        CSVData += this.addColumnHeaderForParam(paramNames[0]);
        for (var k = 1; k < paramNames.length; k++)
        {
            CSVData += "," + this.addColumnHeaderForParam(paramNames[k]);
            //console.log("CSVDATA2", CSVData);
        }
        CSVData += "\r\n";
        //console.log("CSVDATA3", CSVData);
        if (rawDataForCSV != null) {
            for (var dateName in rawDataForCSV) {

                var tempDate = dateName.replace(".", "-").replace(".", "-");
                CSVData += tempDate + ",";
                CSVData += deviceId + ",";
                var colInfo = rawDataForCSV[dateName];
                if (colInfo[paramNames[0].toUpperCase()] != null) {
                    CSVData += colInfo[paramNames[0].toUpperCase()][0].toString() + ",";
                    CSVData += colInfo[paramNames[0].toUpperCase()][1].toString() + ",";
                    CSVData += colInfo[paramNames[0].toUpperCase()][2].toString();
                }
                else
                {
                    CSVData += '-' + ",";
                    CSVData += '-';
                }
                for (var j = 1; j < paramNames.length; j++) {

                    var keyName = paramNames[j].toUpperCase();
                    if (colInfo[keyName] != null) {

			if(colInfo[keyName][0] == null)
			{
				colInfo[keyName][0]= "no number"
			}
			if(colInfo[keyName][1] == null)
			{
				colInfo[keyName][1]= "no number"
			}  
                        CSVData += "," + colInfo[keyName][0].toString() + ",";
                        CSVData += colInfo[keyName][1].toString() + ",";
                        CSVData += colInfo[keyName][2].toString();
                    }
                    else {
                        CSVData += ",-,-";
                    }
                }
                CSVData += "\r\n";
            }
        }
        return CSVData;
    //    window.URL = window.URL || window.webkitURL;

    //    var data = 'some data here...',
    //blob = new Blob([data], { type: 'text/plain' }),
    //u//rl = $window.URL || $window.webkitURL;

    //    var blob = new Blob([CSVData], { type: 'text/plain' });
    //    $scope.linkDownloadStat = window.URL.createObjectURL(blob);
    }
}
function ChartData()
{
    this.valuesPerParams = [];
    this.xAxisPerParams = [];
    this.xAxisPerParamsDateInfo = [];

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

        return day + '/' + monthNames[monthIndex] + '/' + (year%100);
    }
    this.padDigits = function (number, digits) {
        return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
    }
    this.addParamValue = function (paramName, value,timeEpoch) {

        if (this.valuesPerParams[paramName] == null)
        {
            this.valuesPerParams[paramName] = [];
            this.xAxisPerParams[paramName] = [];
            this.xAxisPerParamsDateInfo[paramName] = [];
        }
        this.valuesPerParams[paramName].push(value);
        var d = new Date(timeEpoch);

        var xLabel = this.formatDate(d);
        var previousData = null;
        if (this.xAxisPerParamsDateInfo[paramName].length > 0) {
            previousData = this.xAxisPerParamsDateInfo[paramName][this.xAxisPerParamsDateInfo[paramName].length - 1];
        }

        if (previousData != null && previousData.getDate() == d.getDate() &&
            previousData.getFullYear() == d.getFullYear() &&
            previousData.getMonth() == d.getMonth() ) {
            xLabel = this.padDigits(d.getHours(),2) + ":" + this.padDigits(d.getMinutes(),2) + ":" +this.padDigits(d.getSeconds(),2);
        }
        else {
            xLabel += " " + this.padDigits(d.getHours(),2) + ":" + this.padDigits(d.getMinutes(),2) + ":" + this.padDigits(d.getSeconds(),2);
        }

        this.xAxisPerParams[paramName].push(xLabel);
        this.xAxisPerParamsDateInfo[paramName].push(d);
    }

    this.addParamValueEx = function (paramName, value, xAxisTimeLabelValue) {

        if (this.valuesPerParams[paramName] == null) {
            this.valuesPerParams[paramName] = [];
            this.xAxisPerParams[paramName] = [];
        }
        this.valuesPerParams[paramName].push(value);

        this.xAxisPerParams[paramName].push(xAxisTimeLabelValue.replace('.','/').replace('.','/'));
    }

    this.getXAxisLabelsForParam = function (paramName) {

        var result = [];
        if (this.xAxisPerParams[paramName] != null) {
            result = this.xAxisPerParams[paramName];
        }

        return result;
    }


    this.getValuesForParam = function (paramName) {

        var result = [];
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
angular.module('F1FeederApp.controllers').

  controller('liveDataController', function ($scope, $routeParams, $location, ergastAPIservice) {

      var isRefreshLiveDatacompleted = true;
      var isRefreshStatDataTablecompleted = true;
      var isRefreshStatChartDataCompleted = true;

      var devices = [];
      $scope.devices = devices;

   
      var initLiveDataLineChartVariables = function ()
      {
          $scope.liveChartData = new ChartData();
          $scope.labels = [];
          $scope.data = [];
          $scope.series = ['Series A'];
          $scope.options = {
              responsive:true
          };
          $scope.colors = [{
              pointBackgroundColor: '#0062ff',
              pointHoverBackgroundColor: '#0062ff',
              borderColor: '#0062ff',
              pointBorderColor: '#0062ff',
              pointHoverBorderColor: '#0062ff',
              fill: true /* this option hide background-color */
          }];
      }


      var initStatDataLineChartVariables = function () {
          $scope.selectedStatChartItem = "[ALL]";
          $scope.statChartData = new ChartData();
          $scope.statLineChartlabels = [];
          $scope.statLineChartData = [];
          $scope.statLineChartSeries = null;
          $scope.statLineChartOptions = {
              responsive: true
          };
          $scope.selectedStatChartItem = "[ALL]";
          $scope.statChartingParams = [];
      }

      $scope.startDateForDownload = new Date().toISOString().substring(0, 10); //"2017-03-10";//new Date();
      $scope.endDateForDownload = null;//new Date().toISOString().substring(0, 10);;

      $scope.selectedChartItem = null;
      $scope.id = $routeParams.id;
      $scope.races = [];
      $scope.driver = null;
      $scope.liveDataTimeStart = null;
      $scope.liveDataTimeEnd = null;
      $scope.liveTablePageSize = 50;
      $scope.liveTableOffset = 0;
      $scope.liveTableTotalCount = 0;
      $scope.devices = [];

      $scope.statTableOffset = 0;
      $scope.statDataTimeStart = null;
      $scope.statDataTimeEnd = null;

      $scope.statTablePageSize = 50;

      $scope.statChartPageSize = 50;
      $scope.statChartDataOffset = 0;
      $scope.statTableTotalCount = 0;
      $scope.statChartTotalCount = 0;

      $('.collapse').on('shown.bs.collapse', function () {
          $(this).parent().find(".glyphicon-plus").removeClass("glyphicon-plus").addClass("glyphicon-minus");
      }).on('hidden.bs.collapse', function () {
          $(this).parent().find(".glyphicon-minus").removeClass("glyphicon-minus").addClass("glyphicon-plus");
      });

      $scope.isStatDownloadFileProcessingFinished = false;
      $scope.isLiveDataDownloadFileProcessingFinished = false;
      $scope.isLiveDataDownloadFileProcessingOngoing = false;
      $scope.isStatDataDownloadFileProcessingOngoing = false;
      $scope.isLiveDataPagerVisible = true; 

      $scope.isLiveDataDownloadOngoing = function () {
          return $scope.isLiveDataDownloadFileProcessingOngoing;
      }
      $scope.isStatDataDownloadOngoing = function () {
          return $scope.isStatDataDownloadFileProcessingOngoing;
      }
      var generateLiveCSVData = function (rawDataForCSV,addHeader) {

          var csvGenerator = new LiveCSVDataGenerator();

          var paramNames = [];
          if ($scope.selectedDeviceInfo.tag != null && $scope.selectedDeviceInfo.tag.paramDefinitions != null ) {
              for (var i = 0; i < $scope.selectedDeviceInfo.tag.paramDefinitions.length; i++) {
                  paramNames.push($scope.selectedDeviceInfo.tag.paramDefinitions[i].paramName);
                  console.log('param Name', i, $scope.selectedDeviceInfo.tag.paramDefinitions[i].paramName);
              }
          }

          var fileContent = csvGenerator.generateCSVData(paramNames, $scope.selectedDeviceInfo.tag.location.landMark, rawDataForCSV,addHeader);
          return fileContent;
      }

      $scope.downloadLiveData = function () {

          $scope.isLiveDataDownloadFileProcessingFinished = false;
          $scope.isLiveDataDownloadFileProcessingOngoing = true;
          var arrDate1 = null;
          var timeStartEpoch = null;
          var timeEndEpoch = null;
          if ($scope.startDateForLiveDataDownload != null) {
              arrDate1 = $scope.startDateForLiveDataDownload.split('-');
              var d1 = new Date(arrDate1[0], arrDate1[1] - 1, arrDate1[2], 0, 0, 0, 0);
              timeStartEpoch = d1.valueOf();
          }

          if ($scope.endDateForLiveDataDownload != null) {
              arrDate2 = $scope.endDateForLiveDataDownload.split('-');
              var d2 = new Date(arrDate2[0], arrDate2[1] - 1, arrDate2[2], 23, 59,59, 999);
              timeEndEpoch = d2.valueOf();
          }

          var diffEpoch = Math.abs(timeEndEpoch - timeStartEpoch);
          var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
          if (diffEpoch / oneDay > 90) {
              alert("Selected period exceeds 90 days!.Please select a date within that")
              $scope.isLiveDataDownloadFileProcessingOngoing = false;
              return;
          }

          if (timeStartEpoch == null || timeEndEpoch == null) {
              alert("Please select start and end date to proceed download operation.")
              $scope.isLiveDataDownloadFileProcessingOngoing = false;
              return;
          }
          var tempTimeEnd = null;
          var dayEpochEnd = (24 * 60 * 60 * 1000) - 1;

          var liveDataPerDay = [];
          var isFirstDay = true;
          var limit = 4000;// max sample for day
          var funcDownloadForDay = function () {

              ergastAPIservice.getLiveData([$scope.selectedDeviceInfo.tag.logicalDeviceId], limit, 0, timeStartEpoch, tempTimeEnd, function (liveDataList) {

                  if (liveDataList.liveDataPerDeviceId != null) {
                      for (var i = 0; i < liveDataList.liveDataPerDeviceId.length; i++) {

                          if (liveDataList.liveDataPerDeviceId[i].deviceId == $scope.selectedDeviceInfo.tag.logicalDeviceId) {
                              var tempList = liveDataList.liveDataPerDeviceId[i].dataList;

                              if (tempList != null && tempList.length > 0) {
                                  var dataToCsv = {};
                                  for (var j = tempList.length-1 ; j >=0 ; j--) {

                                      var liveData = tempList[j].data;
                                      var epoch = liveData.receivedTime;
                                      var sampleTime = new Date(epoch);
                                      var rowData = {};
                                      dataToCsv[sampleTime.toString()] = rowData

                                      for(var param in liveData){
                                          rowData[param.toUpperCase()] = liveData[param];

                                      }
                                  }

                                  var fileContent = generateLiveCSVData(dataToCsv, isFirstDay);
                                  isFirstDay = false;
                                  liveDataPerDay.push(fileContent)
                                  break;
                              }
                          }
                      }
                  }

                  timeStartEpoch += ((dayEpochEnd)+1);
                  if (timeStartEpoch < timeEndEpoch) {

                      tempTimeEnd = timeStartEpoch + dayEpochEnd;
                      funcDownloadForDay();
                  }
                  else {
                      // completed
                      $scope.isLiveDataDownloadFileProcessingOngoing = false;
                      if (liveDataPerDay != null && liveDataPerDay.length > 0) {
                          window.URL = window.URL || window.webkitURL;
                          $scope.isLiveDataDownloadFileProcessingFinished = true;
                          var blob = new Blob([liveDataPerDay], { type: 'text/plain' });
                          $scope.linkDownloadLive = window.URL.createObjectURL(blob);
                      }
                      else {
                          alert("No data found on that period");
                      }
                  }
              });
          }

          tempTimeEnd = timeStartEpoch + dayEpochEnd;
          funcDownloadForDay();

      }
      
      $scope.liveEndDateChange = function () {
          var dates = $scope.dateLiveEnd.split('-');
          var y = Number(dates[0]);
          var m = Number(dates[1]);
          var d = Number(dates[2]);

          //year-m-date
          var today = new Date();
          today.setYear(y);
          today.setMonth(m - 1);
          today.setDate(d);
          today.setHours(23, 59, 59, 0);
          $scope.liveDataTimeEnd = today.valueOf();//yesterday.valueOf();


          reloadLiveDataAll();
      }

      $scope.liveStartDateChange = function () {
          
          var dates = $scope.dateLiveStart.split('-');
          var y = Number(dates[0]);
          var m = Number(dates[1]);
          var d = Number(dates[2]);

          //year-m-date
          var today = new Date();
          today.setYear(y);
          today.setMonth(m - 1);
          today.setDate(d);
          today.setHours(0, 0, 0, 0);

          $scope.liveDataTimeStart = today.valueOf();//yesterday.valueOf();


          reloadLiveDataAll();
      }


      //$scope.selectedDeviceLiveData = null;
      $scope.selectedStatChartParamNameForDisplay = "";
      $scope.selectedStatTableSelectionParamList = [];
      $scope.selectStatParameterForTableview = function (param)
      {
          var i = 0;
          for (; i < $scope.selectedStatTableSelectionParamList.length; i++) {
              if ($scope.selectedStatTableSelectionParamList[i].paramName == param.paramName)
                  break;
          }
          if (i >= $scope.selectedStatTableSelectionParamList.length) {
              i = -1;
          }
          var idx = i;//$scope.selectedStatTableSelectionParamList.indexOf(param);

          // Is currently selected
          if (idx > -1) {
              $scope.selectedStatTableSelectionParamList.splice(idx, 1);
          }
              // Is newly selected
          else {
              $scope.selectedStatTableSelectionParamList.push(param);
          }
      
          
          $scope.statSelectedParams = getStatSelectedTableViewParams();
          reloadStatDataTableComplete();
         
      }

      $scope.downloadStat = function ()
      {
          $scope.isStatDownloadFileProcessingFinished = false;
          $scope.isStatDataDownloadFileProcessingOngoing = true;
          var arrDate1 = null;
          var timeStartEpoch= null;
          var timeEndEpoch = null;

          if ($scope.startDateForDownload != null) {
              arrDate1 = $scope.startDateForDownload.split('-');
              if ($scope.statTimeFrameForDisplay == "Monthly") {
                  arrDate1[2] = 1;
              }
              if ($scope.statTimeFrameForDisplay == "Yearly") {
                  arrDate1[2] = 1;
                  arrDate1[1] = 1;
              }
              var d1 = new Date(arrDate1[0], arrDate1[1] - 1, arrDate1[2],0,0,0,0);
              timeStartEpoch = d1.valueOf();
          }

          if ($scope.endDateForDownload != null) {
              arrDate2 = $scope.endDateForDownload.split('-');
               if ($scope.statTimeFrameForDisplay == "Monthly") {
                   arrDate2[2] = 0;
                   arrDate2[1]++;
               }
               if ($scope.statTimeFrameForDisplay == "Yearly") {
                   arrDate2[2] = 31;
                   arrDate2[1] = 12;
               }
               var d2 = new Date(arrDate2[0], arrDate2[1] - 1, arrDate2[2], 23, 59, 59, 999);//23, 59,59, 999
              timeEndEpoch = d2.valueOf();
          }


          getStatDataTableCount($scope.selectedDeviceInfo, null, 0, null, timeStartEpoch, timeEndEpoch, function (err, count) {

              if (!err) {
		        var paramarr = ['temperature','pressure','humidity','PM10','PM2p5',"CO",'NO2','SO2','CO2','AQI']
                  ergastAPIservice.getStatDataForDevice([$scope.selectedDeviceInfo.deviceId], count+1,
                     0, timeStartEpoch, timeEndEpoch, $scope.statTimeFrame, paramarr/*$scope.statSelectedParams*/, function (statDataList) {
                         var selectedStatList = null;
                         if (statDataList.statPerDeviceId != null) {
                             for (var i = 0; i < statDataList.statPerDeviceId.length; i++) {
                                 var tempList = statDataList.statPerDeviceId[i];
                                 if (tempList.deviceId == $scope.selectedDeviceInfo.deviceId) {
                                    
                                     if ($scope.statTimeFrame == "daily")
                                         selectedStatList = tempList.stat.dailyStat;
                                     else if ($scope.statTimeFrame == "monthly")
                                         selectedStatList = tempList.stat.monthlyStat;
                                     else if ($scope.statTimeFrame == "yearly")
                                         selectedStatList = tempList.stat.yearlyStat;
                                     break;
                                 }
                             }
                         }

                         if (selectedStatList != null) {
			     var injun = 0
			     for(var i= 0;i < selectedStatList.length ; i++){
				if(selectedStatList[i].statParams.sum == null){
					injun = injun+1
				}
			     }
                             var dataToCsv = {};
                             for (var i = 0; i < selectedStatList.length; i++) {
                                 var temp = selectedStatList[i].key.toString();
                                 temp.replace(".", "_");
                                 if ( dataToCsv[temp] == null)
                                 {
                                     dataToCsv[temp] = {}
                                 }

                                 var k = dataToCsv[temp];
                                 k[selectedStatList[i].paramName.toUpperCase()] = [selectedStatList[i].statParams.max, selectedStatList[i].statParams.min, selectedStatList[i].statParams.sum/selectedStatList[i].statParams.count,];
                                 //console.log("SELECTEDK", k[selectedStatList[i].paramName])
                             }
			     if(injun == selectedStatList.length){
				alert("no value for these dates")
				$scope.isStatDataDownloadFileProcessingOngoing = false
			     }
			     else{

                             var fileContent =  generateCSVData(dataToCsv);
                             window.URL = window.URL || window.webkitURL;

                             var blob = new Blob([fileContent], { type: 'text/plain' });
                             $scope.linkDownloadStat = window.URL.createObjectURL(blob);
                             $scope.isStatDownloadFileProcessingFinished = true;
                             $scope.isStatDataDownloadFileProcessingOngoing = false;
                             }	
			 }
                     });


                  
              }
          });
         
      }

      
      var generateCSVData = function (rawDataForCSV) {
          var csvGenerator = new StatCSVDataGenerator();

          var paramNames = [];
          if ($scope.selectedDeviceInfo.tag != null && $scope.selectedDeviceInfo.tag.paramDefinitions!= null)
          {
              for(var i = 0; i <  $scope.selectedDeviceInfo.tag.paramDefinitions.length;i++)
              {
                  paramNames.push($scope.selectedDeviceInfo.tag.paramDefinitions[i].paramName);
                  //console.log('param Name', i, $scope.selectedDeviceInfo.tag.paramDefinitions[i].paramName);
              }
          }
	  var paramarr = ['temperature','pressure','humidity','PM10','PM2p5','CO2','CO','NO2','SO2','AQI']

          var fileContent = csvGenerator.generateCSVData(paramarr,$scope.selectedDeviceInfo.tag.location.landMark, rawDataForCSV);
          return fileContent;

          //window.URL = window.URL || window.webkitURL;
          //var blob = new Blob([fileContent], { type: 'text/plain' });
          //$scope.linkDownloadStat = window.URL.createObjectURL(blob);
          //$scope.isStatDownloadFileProcessingFinished = true;
      }


      var reloadStatDataTableComplete = function ()
      {

          $scope.statTableOffset = 0;
          getStatDataTableCount($scope.selectedDeviceInfo, $scope.liveTablePageSize, $scope.liveTableOffset,$scope.statSelectedParams,null,null, function (err, count) {

              if (!err) {

                  $scope.statTableTotalCount = count;
                  refreshStatDataTablePage();

              }
          });
      }

      var reloadStatDataChartComplete = function () {

          $scope.statChartDataOffset = 0;
          getStatDataChartCount($scope.selectedDeviceInfo, function (err, count1) {

              if (!err) {

                  $scope.statChartTotalCount = count1;
                  refreshStatChartData();
              }
          });
      }

      var getStatSelectedTableViewParams = function(){
          var res = "";
          if ($scope.selectedStatTableSelectionParamList.length > 0)
          {
              res += $scope.selectedStatTableSelectionParamList[0].paramName;
          }
          for (var i = 1; i < $scope.selectedStatTableSelectionParamList.length; i++) {
              res += "," + $scope.selectedStatTableSelectionParamList[i].paramName;
          }
          return res;
      }
      $scope.statSelectedParamsForChart = null;

      $scope.selectStatChartParameter = function (param)
      {
          $scope.selectedStatChartParamNameForDisplay = param.displayName;

          $scope.statSelectedParamsForChart = param.paramName;

          reloadStatDataChartComplete();
      }

      var getParamNameFromDispName = function (dispName) {

          var paramName = null;
          var devInfo = $scope.selectedDeviceInfo.tag;

          if (devInfo != null && $scope.selectedDeviceSpec.paramDefinitions != null) {
              for (var j = 0; j < $scope.selectedDeviceSpec.paramDefinitions.length; j++) {
                  if (dispName == $scope.selectedDeviceSpec.paramDefinitions[j].displayName) {

                      paramName = $scope.selectedDeviceSpec.paramDefinitions[j].paramName;
                      break;;
                  }
              }
          }
          return paramName;
      }
      $scope.showLiveDataChartForParam = function (param){

          //selectedDeviceLiveDataHeader
          var paramName = getParamNameFromDispName(param);
          $scope.selectedChartItem = param;
          if ($scope.liveChartData != null) {

              var axisX = $scope.liveChartData.getXAxisLabelsForParam(paramName);
              var values = $scope.liveChartData.getValuesForParam(paramName);
              $scope.labels = axisX;
              $scope.data = [values];
              $scope.series = [paramName];
          }
      }

      $scope.isStatDataTableLoadingOngoing = function () {

          return !isRefreshStatDataTablecompleted;
      }

      $scope.isStatDataChartLoadingOngoing = function () {

          return !($scope.isRefreshStatChartDataCompleted);
      }

      $scope.showStatDataChartForParam = function (param)
      {
          $scope.statLineChartlabels = [];
          $scope.statLineChartData = [];
          $scope.statLineChartSeries = null;

          var seriesNames = [];
          $scope.selectedStatChartItem = param;
          if (param == "[ALL]") {
              var axisX = null;
              for (var i = 0; i < $scope.statChartingParams.length; i++) {

                  var item = $scope.statChartingParams[i];
                  if (item == "[ALL]")
                      continue;
                  var values = $scope.statChartData.getValuesForParam(item);
                  if (axisX == null) {
                      axisX = $scope.statChartData.getXAxisLabelsForParam(item);
                  }
                  if (values != null)
                      $scope.statLineChartData.push(values);
                  seriesNames.push(item);
              }

              $scope.statLineChartlabels = axisX;

          }
          else
          {          //$scope.selectedChartItem = param;
              if ($scope.statChartData != null) {

                  var axisX = $scope.statChartData.getXAxisLabelsForParam(param);
                  var values = $scope.statChartData.getValuesForParam(param);
                  $scope.statLineChartlabels = axisX;
                  $scope.statLineChartData = [values];
                  seriesNames.push(param);
              }
          }

          $scope.statLineChartSeries = seriesNames;
      }

      $scope.getDeviceSubTypeString = function (subType) {
          if (subType == "EnvSensorDevice")
              return "ESDEL001";
          return subType;
      }

      

      initLiveDataLineChartVariables();
      initStatDataLineChartVariables();
      $scope.selectedDeviceLiveDataHeader = []
      $scope.selectedDeviceStatParamSelection = []
      $scope.statDataTableHeader = [];//["Parameter","Average","Min","Max","Total Samples"]
      $scope.statSelectedParams = null;

      
      var createStatDataSelectionOptions = function (data,deviceSpec) {

          var listHeader = [];
          for (var name in data) {
              
              
              var findParamItem = deviceSpec.paramDefinitions.find(function(obj){ return obj.paramName == name; });
              if (findParamItem != null && findParamItem.isDisplayEnabled) {

                  if (findParamItem.paramName == "receivedTime") {
                      continue;
                  }

                  listHeader.push({ displayName: findParamItem.displayName, paramName: findParamItem.paramName });
              }
             

              
          }
          return listHeader;
      }

      var createLiveDataTableHeader = function (data) {

          listHeader = [];
          var devInfo = $scope.selectedDeviceInfo.tag;

          if (devInfo != null && $scope.selectedDeviceSpec.paramDefinitions != null)
          {
              for (var j = 0; j < $scope.selectedDeviceSpec.paramDefinitions.length; j++)
              {
                  if (data[$scope.selectedDeviceSpec.paramDefinitions[j].paramName] != null && $scope.selectedDeviceSpec.paramDefinitions[j].isDisplayEnabled)
                  //if ($scope.selectedDeviceSpec.paramDefinitions[j].isDisplayEnabled)
                  {
                      listHeader.push($scope.selectedDeviceSpec.paramDefinitions[j].displayName + " ("+$scope.selectedDeviceSpec.paramDefinitions[j].unit+")");
                  }
              }
          }
          return listHeader;
      }

      var createLiveDataParamList = function (data) {

          listHeader = [];
          var devInfo = $scope.selectedDeviceInfo.tag;

          if (devInfo != null && $scope.selectedDeviceSpec.paramDefinitions != null) {
              for (var j = 0; j < $scope.selectedDeviceSpec.paramDefinitions.length; j++) {
                  if (data[$scope.selectedDeviceSpec.paramDefinitions[j].paramName] != null && $scope.selectedDeviceSpec.paramDefinitions[j].isDisplayEnabled) {
                      listHeader.push($scope.selectedDeviceSpec.paramDefinitions[j].displayName );
                  }
              }
          }
          return listHeader;
      }

      var createStatDataTableHeader = function (data) {

          var headerMap = {
              count: "Samples Count",
              min: "Min",
              max: "Max",
              average: "Average"
          };
          var listHeader = ["Parameter","Unit"];
          for (var name in data.statParams) {

              listHeader.push(headerMap[name]);
          }

          listHeader.push("Date");
          return listHeader;
      }

      var createStatChartingItems = function (data) {

          var listHeader = ["[ALL]"];
          for (var name in data.statParams) {

              listHeader.push(name);
          }
          return listHeader;
      }

      $scope.map =
      {
          center: { latitude: 23.220325, longitude: 72.652877 },
          zoom: 1,
          markers: [],
          //events: {
          //    click: function (map, eventName, originalEventArgs) {
          //        var e = originalEventArgs[0];
          //        var lat = e.latLng.lat(), lon = e.latLng.lng();
          //        var marker = {
          //            id: Date.now(),
          //            coords: {
          //                latitude: lat,
          //                longitude: lon
          //            }
          //        };
          //        $scope.map.markers.push(marker);
          //        console.log($scope.map.markers);
          //        $scope.$apply();
          //    }
          //}
      };

      var addMarkerToMap = function (deviceInfo)
      {
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


      var showDeviceInMap = function (deviceInfo)
      {
          if ($scope.map != null && $scope.map.markers != null &&
              deviceInfo != null && deviceInfo.location != null
              ) {

              var mapCenter = {

                  latitude: parseFloat(deviceInfo.location.latitude),
                  longitude: parseFloat(deviceInfo.location.longitude)
              }
              $scope.map.zoom = 16;
              $scope.map.center = mapCenter;
              $scope.$apply();
          }

      }

      // list of list (string)
      $scope.selectedDeviceLiveDataTableContent = [];
      $scope.selectedDeviceStatTableContent = [];

      $scope.tab = 2;
      $scope.statTab = 1;

      $scope.setTab = function (newTab)
      {
          $scope.tab = newTab;
          $scope.isLiveDataPagerVisible = newTab != 3;

      };
      $scope.setStatTab = function (newTab)
      {
          $scope.statTab = newTab;
      };
      $scope.isStatDataTabSelected = function (tabNum)
      {
          return $scope.statTab === tabNum;
      };
      

      $scope.isSet = function (tabNum)
      {
          return $scope.tab === tabNum;
      };

      $scope.isLiveDataLoadingOngoing = function () {
          return !isRefreshLiveDatacompleted;
      }

      var addSingleStatDataParamsToChart = function (dataObject) {

          for (var name in dataObject.statParams) {

              paramVal = dataObject.statParams[name].toFixed(2);

             // $scope.statChartData.addParamValueEx(name, dataObject.statParams[name], dataObject.key);
              $scope.statChartData.addParamValueEx(name, paramVal, dataObject.key);
          }

      }
     
      $scope.statTimeFrameForDisplay = "Daily";
      $scope.statTimeFrame = "daily";
      $scope.selectStatTimeFrame = function(statTimeFrame)
      {
          if (statTimeFrame == "daily")
              $scope.statTimeFrameForDisplay = "Daily";
          else if (statTimeFrame == "monthly")
              $scope.statTimeFrameForDisplay = "Monthly";
           else if (statTimeFrame == "yearly")
               $scope.statTimeFrameForDisplay = "Yearly";

          $scope.statTimeFrame = statTimeFrame;

          reloadStatDataTableComplete();
          refreshStatChartData();
      }

      var addRowToLiveDataTableAndChart = function (dataObject) {

          var listRow = [];

          var devInfo = $scope.selectedDeviceInfo.tag;

          if (devInfo != null && $scope.selectedDeviceSpec.paramDefinitions  != null) {
              for (var j = 0; j < $scope.selectedDeviceSpec.paramDefinitions.length; j++) {

                  var paramDefItem = $scope.selectedDeviceSpec.paramDefinitions[j];
                  if (dataObject[paramDefItem.paramName] != null && paramDefItem.isDisplayEnabled) {

                      if (paramDefItem.paramName == "receivedTime")
                              {
                          var utcSeconds = dataObject[paramDefItem.paramName];
                                  var d = new Date(utcSeconds); // The 0 there is the key, which sets the date to the epoch
                                  listRow.push( d.getFullYear()+"/"+(d.getMonth()+1)+"/"+ d.getDate() + " " + d.getHours()+":" + d.getMinutes() + ":" + d.getSeconds());
                                  continue;

                              }


                      var paramVal = dataObject[paramDefItem.paramName];
                      var isNumericItem = dataObject[paramDefItem.paramName].substring == null;
                      if (isNumericItem) {
                          var decimalPlaces = 2;
                          if (paramDefItem.valuePrecision != null) {
                              decimalPlaces = paramDefItem.valuePrecision;
                          }
                          paramVal = paramVal.toFixed(decimalPlaces);
                      }

                      $scope.liveChartData.addParamValue(paramDefItem.paramName, paramVal, dataObject.receivedTime);


                      listRow.push(paramVal);
                  }
              }
          }


          //for (var name in dataObject) {
          //    if (name == "receivedTime")
          //    {
          //        var utcSeconds = dataObject[name];
          //        var d = new Date(utcSeconds); // The 0 there is the key, which sets the date to the epoch
          //        listRow.push( d.getFullYear()+"/"+(d.getMonth()+1)+"/"+ d.getDate() + " " + d.getHours()+":" + d.getMinutes() + ":" + d.getSeconds());
          //        continue;

          //    }
          //    listRow.push(dataObject[name]);
          //}
          $scope.selectedDeviceLiveDataTableContent.push(listRow);
      }

      var addRowToStatDataTable = function (dataObject) {

          if (dataObject.paramName == "receivedTime")
              return;

          var isEnabledForDisp = false;
          var dispName = "";
          var unitName = "NA";
          var paramSpec = null;
          if ($scope.selectedDeviceSpec.paramDefinitions != null) {
              for (var j = 0; j < $scope.selectedDeviceSpec.paramDefinitions.length; j++)
              {
                  if (dataObject.paramName ==  $scope.selectedDeviceSpec.paramDefinitions[j].paramName
                      && $scope.selectedDeviceSpec.paramDefinitions[j].isDisplayEnabled) {
                      isEnabledForDisp = true;
                      paramSpec = $scope.selectedDeviceSpec.paramDefinitions[j];
                      dispName = $scope.selectedDeviceSpec.paramDefinitions[j].displayName;
                      unitName = $scope.selectedDeviceSpec.paramDefinitions[j].unit;
                      break;
                  }
              }
          }

          if (!isEnabledForDisp)
              return;

          var statRow = [];
          statRow.push(dispName);
          statRow.push(unitName);

          var decimalPlaces = 2;
          if (paramSpec.valuePrecision != null) {
              decimalPlaces = paramSpec.valuePrecision;
         }
         

          for (var statName in dataObject.statParams) {
              var s = dataObject.statParams[statName];

              statRow.push(Number.isInteger(s) ? s : s.toFixed(decimalPlaces));
          }
          statRow.push(dataObject.key);
          $scope.selectedDeviceStatTableContent.push(statRow);
      }

      $scope.ceil = function (v) {
          return Math.ceil(v);
      }
      $scope.showPrevPageDataToLiveDataTable = function () {
          if (($scope.liveTableOffset - $scope.liveTablePageSize) >= 0)
              $scope.liveTableOffset -= $scope.liveTablePageSize;
          else
              $scope.liveTableOffset = 0;

          refreshLiveData();
      }

      $scope.showNextPageDataToLiveDataTable = function () {
          if (($scope.liveTableOffset + $scope.liveTablePageSize) < $scope.liveTableTotalCount)
              $scope.liveTableOffset += $scope.liveTablePageSize;
          refreshLiveData();
      }

      $scope.showPrevPageDataToStatDataChart = function () {
          if (($scope.statChartDataOffset - $scope.statChartPageSize) >= 0)
              $scope.statChartDataOffset -= $scope.statChartPageSize;
          else
              $scope.statChartDataOffset = 0;

          refreshStatChartData();
      }
      $scope.showNextPageDataToStatDataChart = function () {
          if (($scope.statChartDataOffset + $scope.statChartPageSize) < $scope.statChartTotalCount)
              $scope.statChartDataOffset += $scope.statChartPageSize;
          refreshStatChartData();
      }

      $scope.showPrevPageDataToStatDataTable = function () {
          if (($scope.statTableOffset - $scope.statTablePageSize) >= 0)
              $scope.statTableOffset -= $scope.statTablePageSize;
          else
              $scope.statTableOffset = 0;

          refreshStatDataTablePage();
      }
      $scope.showNextPageDataToStatDataTable = function () {
          if (($scope.statTableOffset + $scope.statTablePageSize) < $scope.statTableTotalCount)
              $scope.statTableOffset += $scope.statTablePageSize;
          refreshStatDataTablePage();
      }

      $scope.tableSelectItemDevice = function (row, deviceInfo) {
          $scope.selectedRow = row;
          $scope.selectedDeviceInfo = deviceInfo;
          $scope.selectedDeviceLiveDataTableContent = [];
          $scope.selectedDeviceLiveDataHeader = null;

          $scope.selectedDeviceStatTableContent = [];
          $scope.statDataTableHeader = null;
          $scope.selectedDeviceSpec = null;

          showDeviceInMap(deviceInfo.tag);

          ergastAPIservice.getDeviceSpec($scope.selectedDeviceInfo.subType, function (err, spec) {

              if (!err)
              {
                  $scope.selectedDeviceSpec = spec;
                  reloadLiveDataAll();

                  getStatDataTableCount(deviceInfo, $scope.liveTablePageSize, $scope.liveTableOffset, $scope.statSelectedParams, null, null, function (err, count) {

                      if (!err) {

                          $scope.statTableTotalCount = count;
                          refreshStatDataTablePage();

                      }
                  });

                  getStatDataChartCount(deviceInfo, function (err, count1) {

                      if (!err) {

                          $scope.statChartTotalCount = count1;
                          refreshStatChartData();
                      }
                  });
              }

          });


          
         

          
      }
      var reloadLiveDataAll = function () {

          $scope.liveTableOffset = 0;
          getLiveDataCount($scope.selectedDeviceInfo, function (err, count) {

              if (!err) {

                  $scope.liveTableTotalCount = count;
                  refreshLiveData();
              }
          });
      }

      var getStatDataTableCount = function (deviceInfo,pageSize,offset,selectedParams,timeStart,timeEnd ,callBack)
      {
          ergastAPIservice.getStatDataCountForDevice([deviceInfo.deviceId], pageSize, offset, timeStart, timeEnd, $scope.statTimeFrame, selectedParams, function (statDataList)
          {
              var isSuccess = false;
              if (statDataList.statCountPerDeviceId != null) {
                  var i = 0;
                  for (; i < statDataList.statCountPerDeviceId.length; i++) {

                      if (statDataList.statCountPerDeviceId[i].deviceId == $scope.selectedDeviceInfo.deviceId)
                      {
                          if ($scope.statTimeFrame == "daily")
                              callBack(null, statDataList.statCountPerDeviceId[i].stat.dailyStat);
                          else if ($scope.statTimeFrame == "monthly")
                              callBack(null, statDataList.statCountPerDeviceId[i].stat.monthlyStat);
                          else if($scope.statTimeFrame == "yearly")
                              callBack(null, statDataList.statCountPerDeviceId[i].stat.yearlyStat);

                          break;
                      }
                  }
                  isSuccess = (i < statDataList.statCountPerDeviceId.length)
              }
              if (!isSuccess)
                  callBack(null, null);
          });
      }


      var getStatDataChartCount = function (deviceInfo, callBack) {
          ergastAPIservice.getStatDataCountForDevice([deviceInfo.deviceId], $scope.liveTablePageSize, $scope.liveTableOffset, null, null, $scope.statTimeFrame, $scope.statSelectedParamsForChart, function (statDataList) {
              var isSuccess = false;
              if (statDataList.statCountPerDeviceId != null) {
                  var i = 0;
                  for (; i < statDataList.statCountPerDeviceId.length; i++) {

                      if (statDataList.statCountPerDeviceId[i].deviceId == $scope.selectedDeviceInfo.deviceId) {
                          if ($scope.statTimeFrame == "daily")
                              callBack(null, statDataList.statCountPerDeviceId[i].stat.dailyStat);
                          else if ($scope.statTimeFrame == "monthly")
                              callBack(null, statDataList.statCountPerDeviceId[i].stat.monthlyStat);
                          else if ($scope.statTimeFrame == "yearly")
                              callBack(null, statDataList.statCountPerDeviceId[i].stat.yearlyStat);

                          break;
                      }
                  }
                  isSuccess = (i < statDataList.statCountPerDeviceId.length)
              }
              if (!isSuccess)
                  callBack(null, null);
          });
      }


      var getLiveDataCount = function (deviceInfo, callBack)
      {
          ergastAPIservice.getLiveDataCount([deviceInfo.logicalDeviceId], $scope.liveTablePageSize, $scope.liveTableOffset, null, $scope.liveDataTimeEnd, function (liveDataList) {
              var isSuccess = false;
              if (liveDataList.liveDataCountPerDeviceId != null) {
                  var i = 0;
                  for (; i < liveDataList.liveDataCountPerDeviceId.length; i++) {

                      if (liveDataList.liveDataCountPerDeviceId[i].deviceId == $scope.selectedDeviceInfo.logicalDeviceId) {
                          callBack(null, liveDataList.liveDataCountPerDeviceId[i].count);

                          break;
                      }
                  }
                  isSuccess = (i < liveDataList.liveDataCountPerDeviceId.length)
              }
              if (!isSuccess)
                  callBack(null, null);
          });
      }

      $scope.isStatItemSelectedForTableView = function (statItem) {
          var res = $scope.selectedStatTableSelectionParamList.find(function (obj) {
              return obj.paramName == statItem.paramName;
          });

          return res != null;
      }

      var refreshLiveData = function ()
      {
          var deviceInfo = $scope.selectedDeviceInfo;
          $scope.selectedDeviceLiveDataTableContent = [];
          $scope.liveChartData.clear();
          //$scope.selectedChartItem = null;
          $scope.labels = [];
          $scope.data = [];
          $scope.series = [];

          isRefreshLiveDatacompleted = false;
          ergastAPIservice.getLiveData([deviceInfo.logicalDeviceId], $scope.liveTablePageSize, $scope.liveTableOffset, $scope.liveDataTimeStart, $scope.liveDataTimeEnd, function (liveDataList) {

              if (liveDataList.liveDataPerDeviceId != null) {
                  for (var i = 0; i < liveDataList.liveDataPerDeviceId.length; i++)
                  {

                      if (liveDataList.liveDataPerDeviceId[i].deviceId == $scope.selectedDeviceInfo.logicalDeviceId)
                      {
                          var tempList = liveDataList.liveDataPerDeviceId[i].dataList;

                          if (tempList != null && tempList.length > 0)
                          {
                              for (var j = 0 ; j < tempList.length; j++)
                              {
                                  addRowToLiveDataTableAndChart(tempList[j].data);
                                  
                                  if ($scope.selectedDeviceLiveDataHeader == null)
                                  {
                                      $scope.selectedDeviceLiveDataHeader = createLiveDataTableHeader(tempList[j].data);
                                      $scope.selectedLiveDataParameterList = createLiveDataParamList(tempList[j].data);
                                      $scope.selectedDeviceStatParamSelection = createStatDataSelectionOptions(tempList[j].data, $scope.selectedDeviceSpec);
                                      $scope.selectedStatTableSelectionParamList = createStatDataSelectionOptions(tempList[j].data, $scope.selectedDeviceSpec);
                                  }
                              }

                              if ($scope.selectedDeviceLiveDataHeader.length > 0 && $scope.selectedChartItem==null)
                              {
                                  if ($scope.selectedChartItem == null)
                                      $scope.selectedChartItem = $scope.selectedLiveDataParameterList[0];
                              }
                              $scope.showLiveDataChartForParam($scope.selectedChartItem);
                              isRefreshLiveDatacompleted = true;
                              break;
                          }
                      }


                  }
              }
          });
      }

      var processStatData = function (statObject) {
          if (statObject.statParams.sum != null && statObject.statParams.count != null) {
              statObject.statParams.average = statObject.statParams.sum / statObject.statParams.count;
              delete statObject.statParams.sum;
          }
      }

      var refreshStatDataTablePage = function ()
      {
          var deviceInfo = $scope.selectedDeviceInfo;
          $scope.selectedDeviceStatTableContent = [];
          isRefreshStatDataTablecompleted = false;
         // isRefreshLiveDatacompleted = false;
          //deviceIdList, limit, offset, timeStart, timeEnd, timeFrame, paramsList, callBack
          ergastAPIservice.getStatDataForDevice([deviceInfo.deviceId], $scope.statTablePageSize,
              $scope.statTableOffset, $scope.statDataTimeStart, $scope.statDataTimeEnd, $scope.statTimeFrame, $scope.statSelectedParams, function (statDataList) {

                  if (statDataList.statPerDeviceId != null)
                  {
                      for (var i = 0; i < statDataList.statPerDeviceId.length; i++)
                      {
                          var tempList = statDataList.statPerDeviceId[i];
                          if (tempList.deviceId == $scope.selectedDeviceInfo.deviceId)
                          {
                              var selectedStatList = null;
                              if ($scope.statTimeFrame == "daily")
                                  selectedStatList = tempList.stat.dailyStat;
                              else if ($scope.statTimeFrame == "monthly")
                                  selectedStatList = tempList.stat.monthlyStat;
                              else if ($scope.statTimeFrame == "yearly")
                                  selectedStatList = tempList.stat.yearlyStat;

                              if (selectedStatList != null && selectedStatList.length > 0)
                              {
                                  for (var j = 0 ; j < selectedStatList.length; j++)
                                  {
                                      processStatData(selectedStatList[j]);
                                      addRowToStatDataTable(selectedStatList[j]);
                                      
                                      if ($scope.statDataTableHeader == null)
                                      {
                                          $scope.statDataTableHeader = createStatDataTableHeader(selectedStatList[j]);
                                          $scope.statChartingParams = createStatChartingItems(selectedStatList[j])
                                      }
                                      //addSingleStatDataParamsToChart(selectedStatList[j]);
                                  }

                                 
                                  isRefreshStatDataTablecompleted = true;
                                  //$scope.showStatDataChartForParam($scope.selectedStatChartItem);
                                  //isRefreshLiveDatacompleted = true;
                                  break;
                              }
                      }
                  }
              }
          });
      }
      

      var refreshStatChartData = function ()
      {
          var deviceInfo = $scope.selectedDeviceInfo;
          $scope.statChartData = new ChartData();
          $scope.statLineChartlabels = [];
          $scope.statLineChartData = [];
          $scope.statLineChartSeries = null;
          $scope.isRefreshStatChartDataCompleted = false;

          if ($scope.statSelectedParamsForChart == null)
              return;

          // isRefreshLiveDatacompleted = false;
          //deviceIdList, limit, offset, timeStart, timeEnd, timeFrame, paramsList, callBack
          ergastAPIservice.getStatDataForDevice([deviceInfo.deviceId], $scope.statChartPageSize,
              $scope.statChartDataOffset, $scope.statDataTimeStart, $scope.statDataTimeEnd, $scope.statTimeFrame, $scope.statSelectedParamsForChart, function (statDataList) {

                  if (statDataList.statPerDeviceId != null) {
                      for (var i = 0; i < statDataList.statPerDeviceId.length; i++)
                      {
                          var tempList = statDataList.statPerDeviceId[i];
                          if (tempList.deviceId == $scope.selectedDeviceInfo.deviceId)

                          {
                              var selectedStatList = null;
                              if ($scope.statTimeFrame == "daily")
                                  selectedStatList = tempList.stat.dailyStat;
                              else if ($scope.statTimeFrame == "monthly")
                                  selectedStatList = tempList.stat.monthlyStat;
                              else if ($scope.statTimeFrame == "yearly")
                                  selectedStatList = tempList.stat.yearlyStat;

                              if (selectedStatList != null && selectedStatList.length > 0) {
                                  for (var j = 0 ; j < selectedStatList.length; j++)
                                  {
                                      processStatData(selectedStatList[j]);

                                      if ($scope.statDataTableHeader == null) {
                                          $scope.statChartingParams = createStatChartingItems(selectedStatList[j])
                                          //$scope.selectedStatChartItem = $scope.statChartingParams[0];
                                      }
                                      addSingleStatDataParamsToChart(selectedStatList[j]);
                                      
                                  }

                                  $scope.showStatDataChartForParam($scope.selectedStatChartItem);
                                  $scope.isRefreshStatChartDataCompleted = true;
                                  break;
                              }
                          }
                      }
                  }
              });
      }

      $scope.getDeviceTableLoadedPercent = function () {
          if ($scope.devices == null ||$scope.deviceCount == null)
              return 0;

          var progress = ($scope.devices.length / $scope.deviceCount) * 100;
          //alert(progress);

          return progress;
      }

      var loadStatusIndicator = function (deviceInfo) {
          ergastAPIservice.getLiveData([deviceInfo.logicalDeviceId], 1, 0, null, null, function (liveDataList) {

              if (liveDataList.liveDataPerDeviceId != null) {
                  for (var i = 0; i < liveDataList.liveDataPerDeviceId.length; i++) {

                      if (liveDataList.liveDataPerDeviceId[i].deviceId == deviceInfo.logicalDeviceId) {
                          var tempList = liveDataList.liveDataPerDeviceId[i].dataList;
                          deviceInfo.liveStatus = 0;
                          if (tempList != null && tempList.length > 0) {
                              var currentTime = new Date().valueOf();
                              // if any data retrieved within given period show a good status indicator
                              //Math.abs(tempList[0].data.receivedTime - currentTime) < 1000 * 60 * 10) old code
                              if (Math.abs(tempList[0].data.receivedTime - currentTime) < 1000 * 60 * 20) {
                                  deviceInfo.liveStatus = 1; //good
                              }
                              else {
                                  deviceInfo.liveStatus = -1; // bad
                              }
                              
                              break;
                          }
                      }


                  }
              }
          });

      } 
      
      var initPage = function () {
          // load all devices
          ergastAPIservice.getDeviceCount("", function (count) {
              $scope.isDeviceLoadingOngoing = true;
              $scope.deviceCount = count;
              var isFirstDeviceselected = false;
              // for (var i = 0; i < count; i++)
              var i = 0;
              var fetchDevice = function () {

                  ergastAPIservice.getDeviceAt(null, i, function (deviceInfo) {
                      if (deviceInfo != null) {

                          var uiInfo = {
                              deviceId: deviceInfo.deviceId,
                              logicalDeviceId: deviceInfo.logicalDeviceId,
                              devFamily: deviceInfo.devFamily,
                              subType: deviceInfo.subType,
                              tag: deviceInfo,
                              city: deviceInfo.location != null ? deviceInfo.location.city : "",
                              customerName: deviceInfo.customerName,
                              liveStatus: 0
                          }
                          $scope.devices.push(uiInfo);

                          loadStatusIndicator(uiInfo);
                          if (!isFirstDeviceselected) {
                              //$scope.selectedDeviceInfo = $scope.devices[0];
                              $scope.tableSelectItemDevice(0, $scope.devices[0]);

                              isFirstDeviceselected = true;
                          }
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
      }

      
      $scope.refreshLiveDataAsSelectedTime = function (days) {

          // refresh data from today to selected previous days.
          var today = new Date();
          var yesterday = new Date();
          yesterday.setDate(today.getDate() - days);
          
          $scope.liveDataTimeStart = yesterday.valueOf();
          $scope.liveDataTimeEnd = today.valueOf()
          

          reloadLiveDataAll();
      }


      initPage();


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
