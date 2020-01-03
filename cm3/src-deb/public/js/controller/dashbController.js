angular.module('F1FeederApp.controllers').
  
  controller('dashbController', function($scope, $routeParams, $location, $rootScope, $localStorage, ergastAPIservice) {
    $scope.id = $routeParams.id;
    $scope.races = [];
    $scope.driver = null;
	$rootScope.loggedIn = false;
	$scope.userName = null;
	$scope.password = null;
	var allDeviceList = [];
    $scope.average = null;



    
  })