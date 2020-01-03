console.log("Home Controller");
angular.module('F1FeederApp.controllers').

  controller('home_controller', function ($scope, $routeParams, $location, ergastAPIservice) {

    $scope.id = $routeParams.id;
    $scope.races = [];
    $scope.driver = null;
	$scope.devices = [];
	$scope.isAddMode = true;
    $scope.isEditMode = false;
    
    $scope.map =
      {
          center: { latitude: 23.220325, longitude: 72.652877 },
          zoom: 1,
          markers: [],
          
      }

  }
  )