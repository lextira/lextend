angular.module('F1FeederApp.services', [])
    .factory('ergastAPIservice', function ($http) {

      var ergastAPI = {};
   /*     ergastAPI.getkey=function(key, callBack){
            var url='ThirdPartyUser?userId=classic&authPassword=classic';
            $http({
                method: 
            })
        }
        */
        ergastAPI.updateAlarmRule = function (rule, callBack) {
            var url = "/alarm/rules/device?userId=classic&authPassword=classic";
            $http({
                method: 'PUT',
                data: rule,
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else
                    callBack(1);

            })
                .catch(function (data) {
                    callBack(1);
                });
        };

        ergastAPI.deleteAlarmRule = function (ruleName, callBack) {

            if (ruleName == null) {
                callBack(1);
            }
            else {
                var url = '/alarm/rules/device?userId=classic&authPassword=classic';
                if (ruleName != null) {
                    url += "&ruleName=" + ruleName;
                }
                $http({
                    method: 'DELETE',
                    url: url
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok") {
                        callBack(null);
                    }
                    else
                        callBack(1);

                })
                    .catch(function (data) {
                        callBack(1);
                    })
            }
        }

        ergastAPI.updateAlarmRecord = function (record, callBack) {

            var url = "/alarm/records?userId=classic&authPassword=classic";
            $http({
                method: 'PUT',
                data: record,
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else
                    callBack(1);

            })
                .catch(function (data) {
                    callBack(1);
                });
        }

        ergastAPI.getAlarmRecords = function (ruleName, limit, offset, callBack) {
            var url = "/alarm/records?userId=classic&authPassword=classic";
            if (ruleName != null) {
                url += "&ruleName=" + ruleName;
            }
            if (limit != null) {
                url += "&limit=" + limit;
            }
            if (offset != null) {
                url += "&offset=" + offset;
            }

            $http({
                method: 'GET',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(null, response.data.data);
                }
                else
                    callBack(1, null);

            })
                .catch(function (data) {
                    callBack(1, null);
                });



        }


        ergastAPI.getAlarmRecordCount = function (ruleName, callBack) {
            var url = "/alarm/records/count?userId=classic&authPassword=classic";
            if (ruleName != null) {
                url += "&ruleName=" + ruleName;
            }

            $http({
                method: 'GET',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(null, response.data.data.recordCount);
                }
                else
                    callBack(1, null);

            })
                .catch(function (data) {
                    callBack(1, null);
                });

        }

        ergastAPI.getAlarmRuleAt = function (type, index, callBack) {
            var url = "/alarm/rules/device/" + index.toString() + '?userId=classic&authPassword=classic';
            if (type != null) {
                url += "&type=" + type;
            }
            $http({
                method: 'GET',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(null, response.data.data);
                }
                else
                    callBack(1, null);

            })
                .catch(function (data) {
                    callBack(1, null);
                })

        }
        ergastAPI.getAlarmRuleCount = function (type, callBack) {

            var url = '/alarm/rules/device/count?userId=classic&authPassword=classic';
            if (type != null) {
                url += "&type=" + type;
            }
            $http({
                method: 'GET',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(null, response.data.data.ruleCount);
                }
                else
                    callBack(1, 0);

            })
                .catch(function (data) {
                    callBack(1, 0);
                })


        }

        ergastAPI.addAlarmRule = function (rule, callBack) {

            var url = '/alarm/rules/device?userId=classic&authPassword=classic';

            $http({
                method: 'POST',
                data: rule,
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else
                    callBack(1);

            })
                .catch(function (data) {
                    callBack(1);
                });

        }

        ergastAPI.getDeviceDeploymentInfo = function (city, zone, callBack) {
            var url = '/device/deployment/?userId=classic&authPassword=classic';
            if (city != null)
                url += "&city=" + city;
            if (zone != null)
                url += "&zone=" + zone;

            $http({
                method: 'GET',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(null, response.data.data.deploymentInfo);
                }
                else
                    callBack(1, null);

            })
                .catch(function (data) {
                    callBack(1, null);
                });

        }
        ergastAPI.updateDevice = function (deviceJson, callBack) {

            var url = '/device/?userId=classic&authPassword=classic';
            $http({
                method: 'PUT',
                data: deviceJson,
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else
                    callBack(1);
            })
                .catch(function (data) {
                    callBack(1);
                });

        }
        ergastAPI.getDeviceSpec = function (specId, callBack) {

            var url = '/device/spec/?userId=classic&authPassword=classic&type=' + specId;
            $http({
                method: 'GET',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(null, response.data.data);
                }
                else
                    callBack(1, null);

            })
                .catch(function (data) {
                    callBack(1, null);
                });

        }
        ergastAPI.removeDevice = function (deviceId, callBack) {
            var url = '/device?userId=classic&authPassword=classic&deviceId=' + deviceId;
            $http({
                method: 'DELETE',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else
                    callBack(1);

            })
                .catch(function (data) {
                    callBack(1);
                })
        }
        ergastAPI.getLiveDataCount = function (deviceIdList, limit, offset, timeStart, timeEnd, callBack) {

            if (deviceIdList != null) {

                var url = '/device/sensor/livedata/count?userId=classic&authPassword=classic&deviceIds=';
                url += deviceIdList[0];
                for (var i = 1; i < deviceIdList.length; i++) {
                    url += "&" + deviceIdList[i];

                }
                if (limit != null) {
                    url += "&limit=" + limit.toString();
                }
                if (offset != null) {
                    url += "&offset=" + offset.toString();
                }
                if (timeStart != null) {
                    url += "&timeStart=" + timeStart.toString();
                }
                if (timeEnd != null) {
                    url += "&timeEnd=" + timeEnd.toString();
                }


                $http({
                    method: 'GET',
                    url: url
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                        callBack(response.data.data);
                    }
                    else
                        callBack(null);

                })
                    .catch(function (data) {
                        callBack(null);
                    })

            }

        }




        ergastAPI.getStatDataForDevice = function (deviceIdList, limit, offset, timeStart, timeEnd, timeFrame, paramsList, callBack) {

            if (deviceIdList != null) {

                var url = '/device/sensor/stats?userId=classic&authPassword=classic&deviceIds=';
                url += deviceIdList[0];
                for (var i = 1; i < deviceIdList.length; i++) {
                    url += "," + deviceIdList[i];

                }
                if (limit != null) {
                    url += "&limit=" + limit.toString();
                }
                if (offset != null) {
                    url += "&offset=" + offset.toString();
                }
                if (timeStart != null) {
                    url += "&timeStart=" + timeStart.toString();
                }
                if (timeEnd != null) {
                    url += "&timeEnd=" + timeEnd.toString();
                }   
                if (timeFrame != null) {
                    url += "&timeFrame=" + timeFrame;
                }
                if (paramsList != null) {
                    url += "&params=" + paramsList;
                }

                $http({
                    method: 'GET',
                    url: url
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                        callBack(response.data.data);
                    }
                    else
                        callBack(null);

                })
                    .catch(function (data) {
                        callBack(null);
                    })

            }

        }


        ergastAPI.getStatDataCountForDevice = function (deviceIdList, limit, offset, timeStart, timeEnd, timeFrame, paramsList, callBack) {

            if (deviceIdList != null) {

                var url = '/device/sensor/stats/count?userId=classic&authPassword=classic&deviceIds=';
                url += deviceIdList[0];
                for (var i = 1; i < deviceIdList.length; i++) {
                    url += "&" + deviceIdList[i];

                }
                if (limit != null) {
                    url += "&limit=" + limit.toString();
                }
                if (offset != null) {
                    url += "&offset=" + offset.toString();
                }
                if (timeStart != null) {
                    url += "&timeStart=" + timeStart.toString();
                }
                if (timeEnd != null) {
                    url += "&timeEnd=" + timeEnd.toString();
                }
                if (timeFrame != null) {
                    url += "&timeFrame=" + timeFrame;
                }
                if (paramsList != null) {
                    url += "&params=" + paramsList;
                }

                $http({
                    method: 'GET',
                    url: url
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                        callBack(response.data.data);
                    }
                    else
                        callBack(null);

                })
                    .catch(function (data) {
                        callBack(null);
                    })

            }

        }

        ergastAPI.getLiveData = function (deviceIdList, limit, offset, timeStart, timeEnd, callBack) {

            if (deviceIdList != null) {

                var url = '/device/sensor/livedata?userId=classic&authPassword=classic&deviceIds=';
                url += deviceIdList[0];
                for (var i = 1; i < deviceIdList.length; i++) {
                    url += "&" + deviceIdList[i];

                }
                if (limit != null) {
                    url += "&limit=" + limit.toString();
                }
                if (offset != null) {
                    url += "&offset=" + offset.toString();
                }
                if (timeStart != null) {
                    url += "&timeStart=" + timeStart.toString();
                }
                if (timeEnd != null) {
                    url += "&timeEnd=" + timeEnd.toString();
                }


                $http({
                    method: 'GET',
                    url: url
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                        callBack(response.data.data);
                    }
                    else
                        callBack(null);

                })
                    .catch(function (data) {
                        callBack(null);
                    })

            }

        }

        ergastAPI.addDevice = function (deviceInfo, callBack) {

            if (deviceInfo != null) {

                $http({
                    method: "POST",
                    data: deviceInfo,
                    url: 'device?userId=classic&authPassword=classic'
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok") {
                        callBack(null);
                    }
                    else
                        callBack(1);

                })
                    .catch(function (data) {
                        callBack(1);
                    })

            }
            else {
                callBack(1);
            }

        };

        
        ergastAPI.getDeviceAt = function (query, index, callBack) {
            $http({
                method: 'GET',
                url: 'device/' + index.toString() + '?userId=classic&authPassword=classic'
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(response.data.data);
                }
                else
                    callBack(null);

            })
                .catch(function (data) {
                    callBack(null);
                })
        }
        

        ergastAPI.getDeviceCount = function (search, callBack) {
            $http({
                method: 'GET',
                url: 'device/count?userId=classic&authPassword=classic'
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(response.data.data.deviceCount);
                }
                else
                    callBack(0);

            })
                .catch(function (data) {
                    callBack(0);
                })
        }

        ergastAPI.getThirdPartyUserCount = function (search, callBack) {
            $http({
                method: 'GET',
                url: 'thirdpartyuser/count?userId=classic&authPassword=classic'
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(response.data.data.ThirdPartyUserCount);
                }
                else
                    callBack(0);

            })
                .catch(function (data) {
                    callBack(0);
                })
        }

        ergastAPI.getThirdPartyUserAt = function (query, index, callBack) {
            $http({
                method: 'GET',
                url: 'thirdpartyuser/' + index.toString() + '?userId=classic&authPassword=classic'
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(response.data.data);
                    console.log(response.data.data)
                }
                else
                    callBack(null);

            })
                .catch(function (data) {
                    callBack(null);
                })
        }

        ergastAPI.saveThirdPartyUser=function(ThirdPartyUserDetails,callBack){
            if (ThirdPartyUserDetails != null) {

                $http({
                    method: "POST",
                    data: ThirdPartyUserDetails,
                    url: 'thirdpartyuser?userId=classic&authPassword=classic'
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok") {
                        callBack(null);
                    }
                    else
                        callBack(1);

                })
                    .catch(function (data) {
                        callBack(1);
                    })

            }
            else {
                callBack(1);
            }

        }

        ergastAPI.removeThirdPartyUser = function (uName, callBack) {
            var url = '/ThirdPartyUser?userId=classic&authPassword=classic&uName=' + uName;
            $http({
                method: 'DELETE',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else
                    callBack(1);

            })
                .catch(function (data) {
                    callBack(1);
                })
        }
        
        ergastAPI.isThirdPartyUserExist= function(ThirdPartyUserDetails,callBack){

            if(ThirdPartyUserDetails != null){

                $http({
                    method: "POST",
                    data: ThirdPartyUserDetails,
                    url: 'ThirdPartyUser?'
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok") {
                        callBack(null);
                    }
                    else
                        callBack(1);

                })
                    .catch(function (data) {
                        callBack(1);
                    })

            }
            else {
                callBack(1);
            }
            
        }


        ergastAPI.getUserCount = function (search, callBack) {
            $http({
                method: 'GET',
                url: 'user/count?userId=classic&authPassword=classic'
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(response.data.data.userCount);
                }
                else
                    callBack(0);

            })
                .catch(function (data) {
                    callBack(0);
                })
        }

        ergastAPI.getUserAt = function (query, index, callBack) {
            $http({
                method: 'GET',
                url: 'user/' + index.toString() + '?userId=classic&authPassword=classic'
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok" && response.data.data != null) {
                    callBack(response.data.data);
                    console.log(response.data.data)
                }
                else
                    callBack(null);

            })
                .catch(function (data) {
                    callBack(null);
                })
        }
        /*
	ergastAPI.updateDevice = function (userDetails, callBack) {

            var url = '/user?';
            $http({
                method: 'PUT',
                data: userDetails,
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else
                    callBack(1);
            })
                .catch(function (data) {
                    callBack(1);
                });

        }
        */
        ergastAPI.saveUser = function (userDetails, callBack) {

            if (userDetails != null) {

                $http({
                    method: "POST",
                    data: userDetails,
                    url: 'user?userId=classic&authPassword=classic'
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok") {
                        callBack(null);
                    }
                    else
                        callBack(1);

                })
                    .catch(function (data) {
                        callBack(1);
                    })

            }
            else {
                callBack(1);
            }

        };
        ergastAPI.updateUser = function (userDetails, callBack) {
            var url = '/user/?';
            $http({
                method: 'PUT',
                data: userDetails,
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else{
                    callBack(1);
                }
            })
                .catch(function (data) {
                    callBack(1);
                });

        }

        ergastAPI.removeUser = function (uName, callBack) {
            var url = '/user?userId=classic&authPassword=classic&uName=' + uName;
            $http({
                method: 'DELETE',
                url: url
            }).then(function (response) {

                if (response.data != null && response.data.status == "ok") {
                    callBack(null);
                }
                else
                    callBack(1);

            })
                .catch(function (data) {
                    callBack(1);
                })
        }
        
        ergastAPI.isUserExist= function(userDetails,callBack){

            if(userDetails != null){

                $http({
                    method: "POST",
                    data: userDetails,
                    url: 'user?'
                }).then(function (response) {

                    if (response.data != null && response.data.status == "ok") {
                        callBack(null);
                    }
                    else
                        callBack(1);

                })
                    .catch(function (data) {
                        callBack(1);
                    })

            }
            else {
                callBack(1);
            }
            
        }
	ergastAPI.loginprivilegehide=function(logindetails,callBack){
        console.log("SERVICE loginprivilegehide")    
        $http({
                method:'POST',
                params:logindetails,
                url:'loginprivilegehide?'
            }).then(function(response){
                if(response.data !=null && response.data.status =='ok'){
                    callBack(response.data)
                }
                else{
                    callBack(2)
                }
            })
                .catch(function(data){
                    callBack(3)
                })
        }
        ergastAPI.loginprivilege=function(loginDetails,callBack){
            //var logindetails=[loc,userName]
            var logindetails=loginDetails
            console.log("SERVICE loginprivilege")
            $http({
                method:'POST',
                params:logindetails,
                url:'loginprivilege?'
            }).then(function(response){
                if(response.data !=null && response.data.status =='ok'){
                    callBack(response.data)
                }
                else{
                    callBack(2)
                }
            })
                .catch(function(data){
                    callBack(3)
                })
            
        }

        ergastAPI.verifylogin=function(logindetails,callBack){
            
            //logindetails=JSON.stringify(logindetails)
            //alert(logindetails)

            if(logindetails!=null){
                $http({
                    method: "POST",
                    params: logindetails,
                    url: 'login?'
                }).then(function (response) {
                    //alert("reached .then")
                    if (response.data != null && response.data.status == "ok") {
                        callBack(null);
                        //alert("boo")
                    }
                    else{
                        callBack(1);
                        //alert("boo1")
                    }
                })
                    .catch(function (data) {
                        callBack(2);
                        //alert("boo2")
                    })

            }
            else {
                callBack(3);
            }
            
            
        }

        



        return ergastAPI;
    });




angular.module('appMaps', ['uiGmapgoogle-maps'])
    .controller('mainCtrl', function ($scope) {
        $scope.map = { center: { latitude: 28.7041, longitude: 77.1025 }, zoom: 1 };
    });
