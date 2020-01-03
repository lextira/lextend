
angular.module('F1FeederApp.controllers').
  
  controller('loginController', function($scope, $routeParams, $location, $rootScope, $sessionStorage, ergastAPIservice) {
    $scope.id = $routeParams.id;
    $scope.races = [];
    $scope.driver = null;
	//$rootScope.loggedIn = false;
	$scope.loggedIn = false;
	$scope.userName = null;
	$scope.password = null;




	var verifyCredentials = function (userName1, password1,callBack) {

	    var proceed = false;
		console.log('login controller working')
		
		var logindetails={
			userName:userName1,
			password:password1
		}
	    ergastAPIservice.verifylogin( logindetails,function(err){
			if(!err){
				proceed=true
				callBack(proceed)
			}
			else
				callBack(proceed)
		})
		//*/
		//alert("return proceed")
	    //return (proceed);
	    
	}
     $scope.login = function()
	 {
		 //console.log($scope.userName, $scope.password);
         //if( $scope.userName == "admin" && $scope.password == "admin")
		if(  verifyCredentials( $scope.userName ,$scope.password,function(r) 
	    {
			if(!r){
		
				$scope.errorMessage = 'Invalid username or password';
			} 
			else {
			//$rootScope.loggedIn = true;
			$scope.loggedIn = true;
		    $rootScope.userName = $scope.userName;
			$sessionStorage.loggedIn = true;
			$sessionStorage.userName=$scope.userName
			//alert("session storage",JSON.stringify($sessionStorage))
			$location.path('/home');
			
			}

			

		}));
		
	
	}
})



/*
  $scope.login = function()
  {
	console.log($scope.userName, $scope.password);
	if(verifyCredentials( $scope.userName ,$scope.password,function(r)
	{
		if(r){
			$rootScope.loggedIn = true;
		    $rootScope.userName = $scope.userName;
			$sessionStorage.loggedIn = true;
	        $location.path('/home');	
		}
	}));
}
*/