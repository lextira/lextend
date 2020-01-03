var responseModule = require('../HubResponse.js')
var requestValidationModule = require('../RequestValidation.js');
var requestValidation = new requestValidationModule.RequestValidation();

var UserManagerModule = require('../User/UserManager.js')
var userManager = new UserManagerModule.UserManager()



function UserApi(express) {


	express.post('/user', function (req, res) {
		console.log('register a new user details');
		var hubResponse = new responseModule.HubResponse();
		var response = null;
		console.log("USERAPI, ",req.query.userId,req.query.authPassword)
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
			if (result == null) {
				response = hubResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);

			} else {
				if (req.body != null) {

					userManager.saveUser(req.body, function (result) {
						var hubResponse = new responseModule.HubResponse();
						var response = null;
						console.log('user added result', result);
						if (result == 'success') {
							console.log("user added into server database");
							res.end(hubResponse.getOkResponse());
						}
						else {
							console.log("Adding user failed");
							res.end(hubResponse.getErrorResponse(-1, "A project with same id already exist"));

						}
					});
				} else {
					res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
				}
			}
		});

	});

	express.get('/user/count', function (req, res) {
		console.log('fetching user count..');
		var hubResponse = new responseModule.HubResponse();
		var response = null;
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
			if (result == null) {
				response = hubResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);
			} else {
				response = hubResponse.getOkResponse();
				var userSub = null;
				if (req.query.substring != null) {
					userSub = req.query.substring;
				}
				userManager.getUserCount(userSub, function (err, count) {
					if (err != null) {
						response = hubResponse.getErrorResponse(-1, "Invalid request from client");
						res.end(response);
					} else {
						hubResponse = new responseModule.HubResponse();
						var response = null;
						console.log('user count ', count);
						hubResponse.data = { userCount: count };
						response = hubResponse.getOkResponse();
						res.end(response);
					}
				});
			}
		});
	});

	express.get('/user/:index/', function (req, res) {
		console.log('query ', req.query);
		console.log('param ', req.params.index);
		var hubResponse = new responseModule.HubResponse();
		var response = null;
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function(result) {
			if(result == 'failed'){
				response = hubResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);
			} else{
				userManager.getUserAt(req.query, req.params.index, function (result) {
					var hubResponse = new responseModule.HubResponse();
					var response = null;
					if(result != null) {
						hubResponse.data = result;
						response = hubResponse.getOkResponse();
					} else {
						response = hubResponse.getErrorResponse(-1, "Not found");
					}
					res.end(response);
				});
			}
		});
	});

	express.put('/user', function (req, res) {
		console.log('update - user details ');
		var hubResponse = new responseModule.HubResponse();
		var response = null;
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
			if (result == null) {
				response = hubResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);

			}
			else {
				{
					userManager.updateUser(req.body, function (err, msg) {

						if (!err) {
							res.end(hubResponse.getOkResponse());

						}
						else {

							response = hubResponse.getErrorResponse(-1, msg);
							res.end(response);

						}

					});
				}
			}
		});


	});


	express.delete('/user', function (req, res) {
		console.log('Delete request:query=', req.query);
		var slpResponse = new responseModule.HubResponse();
		var response = null;
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
			if (result == null) {
				response = slpResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);

			}
			else {
				userManager.removeUser(req.query.uName, function (err) {
					var slpResponse = new responseModule.HubResponse();
					var response = null;
					if (err) {
						response = slpResponse.getErrorResponse(-1, "Error occured in deleting user");
					}
					else {
						response = slpResponse.getOkResponse();
					}
					res.end(response);
				})
			}
		});

	});

}


module.exports = {
	UserApi
}