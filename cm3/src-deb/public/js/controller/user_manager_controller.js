angular.module('F1FeederApp.controllers').

	controller('userManagementController', function ($scope, $routeParams, $location, $rootScope, $sessionStorage, ergastAPIservice) {
		$scope.id = $routeParams.id;
		$scope.showModal
		$scope.showModal2
		$scope.userPopuptitle = "Add New User";
		$scope.users = [];

		$rootScope.oldUserName

		var reset = function () {
			$scope.newName = "";
			$scope.newEmail = "";
			$scope.newContact = "";
			$scope.newUserName = "";
			$scope.newPassword = "";
			$scope.newPassword2 = "";
			$scope.newRole = "";
		}

		var updateUserPanelTitle = function (isEdit) {
			$scope.addUserPanelTitle = isEdit ? "Update User" : "Add New User";
		}
		updateUserPanelTitle(false);
		

		$scope.updateUser = function () {
			$scope.isAddMode = false;
			$scope.isEditMode = true;

			var newUserObj = {
				name: $scope.newName,
				email: $scope.newEmail,
				contact: $scope.newContact,
				role: $scope.newRole,
				userName: $scope.newUserName,
				password: $scope.newPassword,
				oldUserName:$rootScope.oldUserName
			}

			ergastAPIservice.updateUser(newUserObj, function (err) {
				if (!err) {

					for (var i = 0; i < $scope.users.length; i++) {
						
							$scope.users[i].role = newUserObj.role;
							$scope.users[i].userName = newUserObj.userName;
							$scope.users[i].email = newUserObj.email;
							$scope.users[i].contact = newUserObj.contact;
							$scope.users[i].name = newUserObj.name;
							$scope.users[i].password = newUserObj.password;
							
							break;

					
					}
					$("#addNewUserModal").modal("hide");
					//updateUserPanelTitle(false);
					
					alert("User updated successfully")
				}
			});
			reset()
			//$scope.cancelEdit();

		}

		

		var userInEdit = null;
		$scope.editUser = function (newUserObj, event) {

			//if (!showEditInProgressWarning(newUserObj)) {
			//	event.stopPropagation();
			//	return;
			//}
			userInEdit = newUserObj;
			updateUserPanelTitle(true);
			$scope.isAddMode = false;
			$scope.isEditMode = true;
			$scope.newUserName = newUserObj.userName;
			$scope.newEmail = newUserObj.email;
			$scope.newContact = newUserObj.contact;
			$scope.newRole = newUserObj.role;
			$scope.newName = newUserObj.name;
			$scope.newPassword = newUserObj.password;
			$rootScope.oldUserName=newUserObj.userName
			
		}
		var users = [];

		$scope.users = users;
		$scope.selectedUserInfo = null;

		$scope.cancelEdit = function () {

			userInEdit = null;
			$scope.isEditMode = false;
			$scope.newUserName = null;
			$scope.newEmail = null;
			$scope.newContact = null;
			$scope.newRole = null;
			$scope.newName = null;
			$scope.newPassword = null;

		}

		var showEditInProgressWarning = function (selectedUserInfo) {
			var proceed = true;

			var editInProgress = userInEdit != null && userInEdit.userName != selectedUserInfo.userName;
			if (editInProgress) {
				if (confirm("This will cancel the current edit, Are you sure?")) {
					$scope.cancelEdit();
				}
				else {
					proceed = false;;
				}
			}

			return proceed;
		}

		$scope.selectParamTableRow = function (row) {

			$scope.selectedParamRow = row;
		}
		$scope.selectUser = function (row, newUserObj) {

			//if ($scope.isEditMode) {
			//	if (!showEditInProgressWarning(newUserObj))
			//		return;
			//}

			$scope.selectedRow = row;
			$scope.selectedUserInfo = newUserObj;

		}

		$scope.removeUser = function (userNameToRemove) {


			if (confirm("Are you sure to remove user ? \r\nRemoving user will remove all data from system") == false) {
				return;
			}
			
			ergastAPIservice.removeUser(userNameToRemove, function (err) {
				for (var i = 0; i < $scope.users.length; i++) 
				{
					if ($scope.users[i].userName == userNameToRemove) {
						$scope.users.splice(i, 1);
						break;
					}
				}
				if (!err) {
					alert("Successfull removed user");
				}
				else {
					alert("User removed,But some files can't be removed.");
				}
			});
		}

		$scope.saveUser = function (newName, newEmail, newContact, newRole, newUserName, newPassword, newPassword2) {

			if($scope.newName == null || $scope.newRole == null || $scope.newUserName == null || $scope.newPassword == null){
				alert("Please fill all mandatory fields");
				return;
			}
			if(newName.length < '5'){
				alert("Length of name should be greater than 5");
				alert()
			}
			if(newUserName.length < '5'){
				alert("Length of username should be greater than 5");
				return;
			}
			if(newPassword.length < '6'){
				alert("Length of password should be greater than 6");
				return;
			}
			
			if(newPassword!=newPassword2){
				alert("Passwords do not match")
				return
			}

			if(/\S+@\S+\.\S+/.test(newEmail) == false){
				alert("Provide a valid email")
				return
			}

			if(/^\d{10}$/.test(newContact) == false){
				alert("Provide a valid Contact number")
				return
			}

			

			
			var newUserObj = {
				name: $scope.newName,
				email: $scope.newEmail,
				contact: $scope.newContact,
				role: $scope.newRole,
				userName: $scope.newUserName,
				password: $scope.newPassword
			}
 

			ergastAPIservice.saveUser(newUserObj, function (err) {
				if (!err) {
					alert('User added successfully');
					$scope.users.push({
						name: newUserObj.name,
						email: newUserObj.email,
						contact: newUserObj.contact,
						role: newUserObj.role,
						userName: newUserObj.userName,
						password: newUserObj.password
					});
				} else {
					alert("Couldn't add user")
				}
			});
			$("#addNewUserModal").modal("hide");
			reset();
		};

		ergastAPIservice.getUserCount("", function (count) {
			$scope.userCount = count;
			var i = 0;
			var fetchUsers = function () {

				ergastAPIservice.getUserAt(null, i, function (userInfo) {
					if (userInfo != null) {
						
						if(userInfo.userName != 'sudo'){
						
						$scope.users.push({
							name: userInfo.name,
							email: userInfo.email,
							contact: userInfo.contact,
							role: userInfo.role,
							userName: userInfo.userName,
							password: userInfo.password
						});}
					}
					i++;
					if (i < count) {
						fetchUsers();
					}
				});
			};
			if (i < count) {
				fetchUsers();
			}
		});

		$scope.addNewUser = function () {
			$scope.isAddMode = true
			$scope.userPopuptitle = "Add New User";
			ergastAPIservice.getUserCount("",function(count){
				if(count>=11){
					
					alert("user limit reached")
					
				}
				else{
					
					$("#addNewUserModal").modal("show");
					reset();
				}
			})
		};

	});