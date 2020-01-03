angular.module('F1FeederApp', [
  'F1FeederApp.services',
  'F1FeederApp.controllers',
  'ngRoute',
  'ngStorage',
  'uiGmapgoogle-maps',
  "chart.js",
  'angular-timezone-selector',
  'angularjs-datetime-picker',
  'ngSanitize',
  //'v1'
])
.config(['$routeProvider', function($routeProvider) {
	var loc
  $routeProvider.
	when("/home", {templateUrl: "views/home.html", controller: "homeController"}).

	when("/dashboard", {			
		resolve: {
			"check": function($location, $sessionStorage){
				console.log('checking authenticatin while viewing dashboard', $sessionStorage.loggedIn);
				if($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn){
					console.log('not logged in');
					$location.path('/login');
				}
			}
		},
		templateUrl: "views/heatmap.html",
		controller: "heatmapController"
	}).
	
    when("/heatmap", {
          resolve: {
              "check": function ($location, $sessionStorage) {
                  console.log('checking authenticatin while viewing heatmap', $sessionStorage.loggedIn);
                  if ($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn) {
                      console.log('not logged in');
                      $location.path('/login');
                  }
              }
          },
          templateUrl: "views/dash.html",
          controller: "dashController"
      }).
	when("/device_admin", {
		resolve: {
			"check": function($location, $sessionStorage,ergastAPIservice){
				console.log('checking authenticatin while viewing admin page', $sessionStorage.loggedIn);
				loc=$location.$$path
				if($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn){
					console.log('not logged in');
					$location.path('/login');
				}

				else
					{
						var loginDetails=[loc,$sessionStorage.userName]
						ergastAPIservice.loginprivilege(loginDetails,function(err){
							console.log("this is error",err)
							if(err.data){
								console.log("reaching IF")
							}
							else{
								$location.path('/')
								console.log("reaching ELSE")
								//$window.location.assign('/home')
								
								
							}
						})
					
					}
			}
		},
		templateUrl: "views/device_admin.html", 
		controller: "deviceAdmin"
	}).
	when("/user_management", {
		resolve: {
			"check": function($location, $sessionStorage, ergastAPIservice){
				console.log('checking authenticatin while viewing user management page', $sessionStorage.loggedIn,$location);
				//alert('checking authenticatin while viewing user management page', $sessionStorage.loggedIn);
				loc=$location.$$path
				
				console.log("pathishere",loc)
				if($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn){
					console.log('not logged in');
					$location.path('/login');
				}
				else
					{
						var loginDetails=[loc,$sessionStorage.userName]
						ergastAPIservice.loginprivilege(loginDetails,function(err){
							console.log("this is error",err,$sessionStorage.userName)
							if(err.data){
								console.log("reaching IF")
							}
							else{
								$location.path('/')
								console.log("reaching ELSE")
								//$window.location.assign('/home')
								
								
							}
						})
					
					}
			}
		},
		templateUrl: "views/user_management.html", 
		controller: "userManagementController"
    }).
    when("/api", {
		resolve: {
			"check": function($location, $sessionStorage,ergastAPIservice){
				console.log('checking authenticatin while viewing api page', $sessionStorage.loggedIn);
				loc=$location.$$path
				if($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn){
					console.log('not logged in');
					$location.path('/login');
				}

				
			}
		},
		templateUrl: "views/api.html", 
		controller: "apiController"
	}).
	when("/login", {templateUrl: "views/login.html", controller: "loginController"}).
	when("/live_data", {
		resolve: {
			"check": function($location, $sessionStorage){
				console.log('checking authenticatin while viewing live data', $sessionStorage.loggedIn);
				if($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn){
					console.log('not logged in');
					$location.path('/login');
				}
			}
		},
		templateUrl: "views/live_data.html", 
		controller: "liveDataController"
	}).
    when("/zone_data", {
        resolve: {
            "check": function ($location, $sessionStorage) {
                console.log('checking authenticatin while viewing live data', $sessionStorage.loggedIn);
                if ($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn) {
                    console.log('not logged in');
                    $location.path('/login');
                }
            }
        },
        templateUrl: "views/zone_analysis.html",
        controller: "zone_data_controller"
    }).
    when("/alarm_manage", {
        resolve: {
            "check": function ($location, $sessionStorage,ergastAPIservice) {
				console.log('checking authenticatin while viewing live data', $sessionStorage.loggedIn);
				loc=$location.$$path
                if ($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn) {
                    console.log('not logged in');
                    $location.path('/login');
				}
				else
					{
						var loginDetails=[loc,$sessionStorage.userName]
						ergastAPIservice.loginprivilege(loginDetails,function(err){
							console.log("this is error",err)
							if(err.data){
								console.log("reaching IF")
							}
							else{
								$location.path('/')
								console.log("reaching ELSE")
								//$window.location.assign('/home')
								
								
							}
						})
					
					}
            }
        },
        templateUrl: "views/alarm_management.html",
        controller: "alarmManagementController"
	}).
	/*
    when("/active_alarms", {
        resolve: {
            "check": function ($location, $sessionStorage,ergastAPIservice) {
				console.log('checking authenticatin while viewing live data', $sessionStorage.loggedIn);
				loc=$location.$$path;
                if ($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn) {
                    console.log('not logged in');
                    $location.path('/login');
				}
				else
					{
						ergastAPIservice.loginprivilege(loc,$sessionStorage.userName,function(err){
							console.log("this is error",err)
							if(err.data){
								console.log("reaching IF")
							}
							else{
								$location.path('/')
								console.log("reaching ELSE")
								//$window.location.assign('/home')
								
								
							}
						})
					
					}
            }
        },
        templateUrl: "views/active_alarms.html",
        controller: "activeAlarmsController"
	}). */
	when("/active_alarms", {
		resolve: {
			"check": function($location, $sessionStorage){
				console.log('checking authenticatin while viewing active alarms', $sessionStorage.loggedIn);
				if($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn){
					console.log('not logged in');
					$location.path('/login');
				}
			}
		},
		templateUrl: "views/active_alarms.html", 
		controller: "activeAlarmsController"
	}).

	when("/thirdpartyuser", {
		resolve:{
			"check": function ($location, $sessionStorage,ergastAPIservice) {
				console.log('checking authenticatin while viewing thirdparty user', $sessionStorage.loggedIn);
				loc=$location.$$path
                if ($sessionStorage.loggedIn == undefined || !$sessionStorage.loggedIn) {
                    console.log('not logged in');
                    $location.path('/login');
				}
				
				else
					{
						var loginDetails=[loc,$sessionStorage.userName]
						ergastAPIservice.loginprivilege(loginDetails,function(err){
							console.log("this is error",err)
							if(err.data){
								console.log("reaching IF")
							}
							else{
								$location.path('/')
								console.log("reaching ELSE")
								//$window.location.assign('/home')
								
								
							}
						})
					
					}
            }
		},
		templateUrl: "views/thirdpartyuser.html",
		controller: "thirdpartyuserController"
	}).
	
	when("/", {templateUrl: "views/login.html", controller: "loginController"})
	/*.
	otherwise({redirectTo: '/login'});*/
}]).config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
}])

/*
var testingfunc= function(name){

	$http({
		method:'POST',
		params:name,
		url:'loginprivilege?'
	}).then(function(response){
		if(response.data !=null && response.data.status =='ok'){
			
		}
	})
	
}*/
