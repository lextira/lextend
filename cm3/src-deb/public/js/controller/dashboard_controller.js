angular.module('F1FeederApp.controllers').



  /* Driver controller */
  controller('dashController', function ($scope, $routeParams, ergastAPIservice) {
      $scope.id = $routeParams.id;
      $scope.races = [];
      $scope.driver = null;

      $scope.tab = 1;

      $scope.setTab = function (newTab) {
          $scope.tab = newTab;
      };

      $scope.isSet = function (tabNum) {
          return $scope.tab === tabNum;
      };

      $scope.devices = [];
      $scope.deviceSelected = function (m) {

          var v = new Date();
          var utc = new Date(v.getFullYear(), v.getMonth(), v.getDate());
          //var diffTimeZone = utc.getTimezoneOffset() * 60000;
          var ToGmt = utc.valueOf();//- diffTimeZone;

          ergastAPIservice.getStatDataForDevice([m.id], null, 0, ToGmt, ToGmt, "daily", null, function (data) {


              for (var i = 0; i < data.statPerDeviceId.length; i++) {
                  if (data.statPerDeviceId[i].deviceId == m.id) {
                      var dailyStat = data.statPerDeviceId[i].stat.dailyStat;
                      // show info window for AFM device.
                      showInfoWindowForAFMDevice(dailyStat, m);
                      break;
                  }
              }
          })

      }

      var showInfoWindowForAFMDevice = function (dailyStat, marker) {
          var tableInfo = null;
          var aqi = null;
          if (dailyStat != null) {

              var deviceInfo = marker.tag;
              tableInfo = [];
              for (var j = 0; j < dailyStat.length; j++) {

                  if (deviceInfo.paramDefinitions != null) {
                      var result = deviceInfo.paramDefinitions.filter(function (v) {
                          return v.paramName === dailyStat[j].paramName; // Filter out the appropriate one
                      })
                      if (result != null && result.length > 0) {
                          // this item can't be shown in UI
                          if (result[0].isDisplayEnabled != null && result[0].isDisplayEnabled == false)
                              continue;
                      }
                  }

                  if (dailyStat[j].paramName == "AQI") {
                      aqi = (dailyStat[j].statParams.sum / dailyStat[j].statParams.count).toFixed(2);
                  }
                  var rowInfo = [dailyStat[j].paramName, dailyStat[j].statParams.min.toFixed(2),

                      dailyStat[j].statParams.max.toFixed(2), (dailyStat[j].statParams.sum / dailyStat[j].statParams.count).toFixed(2)];
                  tableInfo.push(rowInfo)

              }


          }
          $scope.infowindow.setContent(getInfoHtmlContentForAFMDevice(tableInfo, marker.id, aqi));
          $scope.infowindow.open($scope.map.control.getGMap(), marker);
      }

      $scope.map = {
          center: {
              latitude: 23.220325,
              longitude: 72.652877
          },
          zoom: 15,
          markers: [],
          control: {},
      }

      $scope.infowindow = new google.maps.InfoWindow({
          content: ''
      });

      var getInfoHtmlContentForDevice = function (paramInfos, deviceId) {

          var infoContent = "";
          infoContent += "<h3>Sensor:" + deviceId + " daily Info</h3>"
          infoContent += "<table class='table table-striped'>";
          infoContent += " <thead>";
          infoContent += " <tr>";
          infoContent += "<th>Parameter</th>";
          infoContent += "<th>Min</th>";
          infoContent += "<th>Max</th>";
          infoContent += "<th>Avg</th>";
          infoContent += "</tr>";
          infoContent += " </thead>";

          infoContent += " <tbody>";
          if (paramInfos != null) {
              for (var i = 0; i < paramInfos.length; i++) {
                  infoContent += " <tr>";
                  for (var j = 0; j < paramInfos[i].length; j++) {
                      infoContent += "<td>" + paramInfos[i][j] + "</td>";
                  }
                  infoContent += "</tr>";
              }
          }
          else {
          }

          infoContent += "</tbody>";
          infoContent += "</table>";

          return infoContent;
      }


      var getInfoHtmlContentForAFMDevice = function (paramInfos, deviceId, aqi) {

          var aqiClass = "";
          if (aqi >= 0 && aqi <= 50)
              aqiClass = "spanAQIGood";
          else if (aqi >= 51 && aqi <= 100)
              aqiClass = "spanAQISatisfactory";
          else if (aqi >= 101 && aqi <= 200)
              aqiClass = "spanAQIModerate";
          else if (aqi >= 201 && aqi <= 300)
              aqiClass = "spanAQIPoor";
          else if (aqi >= 301 && aqi <= 400)
              aqiClass = "spanAQIVeryPoor";
          else if (aqi >= 401)
              aqiClass = "spanAQISevere";


          var infoContent = "";
          infoContent += "<h3>Sensor:" + deviceId + " daily Info</h3>"
          infoContent += "<h3>AQI <span class='" + aqiClass + "'>" + aqi + "</span></h3><hr/>";

          infoContent += "<table class='table table-striped'>";
          infoContent += " <thead>";
          infoContent += " <tr>";
          infoContent += "<th>Parameter</th>";
          infoContent += "<th>Min</th>";
          infoContent += "<th>Max</th>";
          infoContent += "<th>Avg</th>";
          infoContent += "</tr>";
          infoContent += " </thead>";

          infoContent += " <tbody>";
          if (paramInfos != null) {
              for (var i = 0; i < paramInfos.length; i++) {
                  if (paramInfos[i][0] == "receivedTime")
                      continue;
                  infoContent += " <tr>";
                  for (var j = 0; j < paramInfos[i].length; j++) {

                      infoContent += "<td>" + paramInfos[i][j] + "</td>";
                  }
                  infoContent += "</tr>";
              }
          }
          else {
          }

          infoContent += "</tbody>";
          infoContent += "</table>";

          return infoContent;
      }

      var addMarkerToMap = function (deviceInfo) {
          if ($scope.map != null && $scope.map.markers != null &&
              deviceInfo != null && deviceInfo.location != null) {
              var marker = new google.maps.Marker({
                  id: deviceInfo.deviceId,
                  map: $scope.map.control.getGMap(),
                  position: new google.maps.LatLng(parseFloat(deviceInfo.location.latitude), parseFloat(deviceInfo.location.longitude)),
                  tag: deviceInfo,
                  coords: {

                      latitude: parseFloat(deviceInfo.location.latitude),
                      longitude: parseFloat(deviceInfo.location.longitude)
                  }
              });

              //google.maps.event.addListener(marker, 'click', function () {
              //    infowindow.setContent("hello");
              //    infowindow.open(map, this);
              //});

              $scope.map.markers.push(marker);
              $scope.$apply();
          }

      }

      ergastAPIservice.getDeviceCount("", function (count) {
          $scope.deviceCount = count;
          for (var i = 0; i < count; i++) {

              ergastAPIservice.getDeviceAt(null, i, function (deviceInfo) {
                  if (deviceInfo != null) {

                      $scope.devices.push({
                          deviceId: deviceInfo.deviceId,
                          type: deviceInfo.type,
                          devFamily: deviceInfo.devFamily,
                          subType: deviceInfo.subType,
                          tag: deviceInfo
                      });
                      addMarkerToMap(deviceInfo);

                  }

              });


          }
      });


  });

