
//function keygenerate(){
//	var uuidv1= require(uuid/v1)
//	this.Key=uuidv1()
	
//}
angular.module('F1FeederApp.controllers').
	
	controller('thirdpartyuserController', function ($scope, $routeParams, $location, $rootScope, $localStorage, ergastAPIservice) {
		
		
		$scope.id = $routeParams.id;
		$scope.showModal = false;
		$scope.ThirdPartyUserPopuptitle = "Add New User";
		$scope.names = [];
		$scope.limit=[];

	//	var generate=new keygenerate()
	//	$scope.newapiKey=generate.key


		var reset = function () {
			$scope.newName = "";
			$scope.newLimit="";
	//		$scope.newapiKey = "";
		}
		
		
		
		var ThirdPartyUsers = [];

		$scope.ThirdPartyUsers = ThirdPartyUsers;
		$scope.selectedThirdPartyUserInfo = null;
	
		$scope.selectParamTableRow = function (row) {

			$scope.selectedParamRow = row;
		}
		$scope.selectThirdPartyUser = function (row, newThirdPartyUserObj) {

			$scope.selectedRow = row;
			$scope.selectedThirdPartyUserInfo = newThirdPartyUserObj;

        }
        
		$scope.removeThirdPartyUser = function (ThirdPartyUserNameToRemove) {


			if (confirm("Are you sure to remove user ? \r\nRemoving user will remove all data from system") == false) {
				return;
			}
			
			ergastAPIservice.removeThirdPartyUser(ThirdPartyUserNameToRemove, function (err) {
				for (var i = 0; i < $scope.ThirdPartyUsers.length; i++) {
					if ($scope.ThirdPartyUsers[i].name == ThirdPartyUserNameToRemove) {
						$scope.ThirdPartyUsers.splice(i, 1);
						break;

					}
				}
				if (!err) {
					alert("Successfull removed thirdpartyuser");
				}
				else {
					alert("User removed,But some files can't be removed.");
				}
			});
		}

		$scope.saveThirdPartyUser = function(newName) {
			
			console.log("save function called");
			var newThirdPartyUserObj = {
				name: $scope.newName,
				limit:$scope.newLimit
			//	apiKey: $scope.newapiKey,
				
				
			}
 
			
			ergastAPIservice.saveThirdPartyUser(newThirdPartyUserObj, function (err) {
				if (!err) {
					alert('User added successfully');
					$scope.ThirdPartyUsers.push({
						name: newThirdPartyUserObj.name,
						limit:newThirdPartyUserObj.limit
				//	apiKey: newThirdPartyUserObj.apiKey,
					});
				} else {
					alert("Couldn't add user")
				}
			});
			$("#addNewThirdPartyUserModal").modal("hide");
			reset();
		};

		ergastAPIservice.getThirdPartyUserCount("", function (count) {
			$scope.ThirdPartyUserCount = count;
			var i = 0;
			var fetchThirdPartyUsers = function () {

				ergastAPIservice.getThirdPartyUserAt(null, i, function (ThirdPartyUserInfo) {
					console.log("in the controller",ThirdPartyUserInfo)
					if (ThirdPartyUserInfo != null) {

						$scope.ThirdPartyUsers.push({
							name: ThirdPartyUserInfo.name,
							limit:ThirdPartyUserInfo.limit,
						apiKey: ThirdPartyUserInfo.apikey,
							
						});
					}
					i++;
					if (i < count) {
						fetchThirdPartyUsers();
					}
				});
			};
			if (i < count) {
				fetchThirdPartyUsers();
			}
			
			console.log('in the controller',$scope.ThirdpartyUsers)
		});

		$scope.addNewThirdPartyUser = function () {
			$scope.ThirdPartyUserPopuptitle = "Add New User";
			
			
		};

	});