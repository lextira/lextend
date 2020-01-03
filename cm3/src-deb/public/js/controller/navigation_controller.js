angular.module('F1FeederApp.controllers').
  
  controller('navigationController', function($scope, $routeParams, $location, $rootScope, $sessionStorage,ergastAPIservice) {
    $scope.id = $routeParams.id;
	$rootScope.check1=[]
	$scope.check2	

	$scope.openNav = function() {
		document.getElementById("mySidenav").style.width = "250px";
		
		ergastAPIservice.loginprivilegehide([$sessionStorage.userName],function(err){
			console.log("navigation val",err.data[0])
			$rootScope.check1=err.data
			$scope.check2=err.data[1]
			console.log("scope check",$scope.check1[0])
		})
		//$scope.check=check1

	}
	$scope.check1func=function(n){
		console.log("inside check func",$rootScope.check1[n])
		return $rootScope.check1[n]
		
	}

	
	$scope.closeNav = function () {
		document.getElementById("mySidenav").style.width = "0";
	}

	$scope.home = function () {
	    $location.path('/home');
	}

	$scope.dashboard = function()
	{
		$location.path('/dashboard');
	}
	$scope.heatmap = function () {
	    $location.path('/heatmap');
	}
    $scope.logout = function()
	 {
		console.log('Logging out');
		$location.path('/login');
		console.log($sessionStorage.loggedIn);
		delete $sessionStorage.loggedIn;
		console.log($sessionStorage.loggedIn);
	}

//	$scope.check1=function(){
//		ergastAPIservice.loginprivilegehide(null,function(err){
//		console.log("navigation val",err)

		

		
//	})
//	}
  });