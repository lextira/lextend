angular.module('F1FeederApp.controllers', []).

  /* Drivers controller */
  controller('homeController', function ($scope, $location, iotApiService) {
      $scope.nameFilter = null;
      $scope.driversList = [];
      //$scope.name = "hi";

      //$scope.tab = 1;

      //$scope.setTab = function (newTab) {
      //    $scope.tab = newTab;
      //};

      //$scope.isSet = function (tabNum) {
      //    return $scope.tab === tabNum;
      //};



  }).
controller('Pop1', function ($scope, iotApiService) {


    $scope.printHello = function () {
        alert("clicked");
    }

});


//controller('dashController', function ($scope, $routeParams, ergastAPIservice) {
//  $scope.id = $routeParams.id;
//  $scope.races = [];
//  $scope.driver = null;
//  $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };

//  $scope.tab = 1;

//  $scope.setTab = function(newTab){
//      alert("hi");
//    $scope.tab = newTab;
//  };

//  $scope.isSet = function(tabNum){
//    return $scope.tab === tabNum;
//  };

//});
/*.

  
controller('deviceAdmin', function($scope, $routeParams, ergastAPIservice) {
  $scope.id = $routeParams.id;
  $scope.races = [];
  $scope.driver = null;
  
})*/
