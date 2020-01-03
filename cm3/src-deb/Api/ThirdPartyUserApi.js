var responseModule = require('../HubResponse.js')
var requestValidationModule = require('../RequestValidation.js');
var requestValidation = new requestValidationModule.RequestValidation();

var ThirdPartyUserManagerModule = require('../ThirdPartyUser/ThirdPartyUserManager.js')
var ThirdPartyUserManager = new ThirdPartyUserManagerModule.ThirdPartyUserManager()



function ThirdPartyUserApi(express) {


	express.post('/thirdpartyuser', function (req, res) {
		console.log('register a new ThirdPartyUser details');
		var hubResponse = new responseModule.HubResponse();
		var response = null;
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
			if (result == null) {
				response = hubResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);

			} else {
				if (req.body != null) {

					ThirdPartyUserManager.saveThirdPartyUser(req.body, function (result) {
						var hubResponse = new responseModule.HubResponse();
						var response = null;
						console.log('ThirdPartyUser added result', result);
						if (result == 'success') {
							console.log("ThirdPartyUser added into server database");
							res.end(hubResponse.getOkResponse());
						}
						else {
							console.log("Adding ThirdPartyUser failed");
							res.end(hubResponse.getErrorResponse(-1, "A project with same id already exist"));

						}
					});
				} else {
					res.end(hubResponse.getErrorResponse(-1, "Invalid request"));
				}
			}
		});

	});

	express.get('/thirdpartyuser/count', function (req, res) {
		console.log('fetching ThirdPartyUser count..');
		var hubResponse = new responseModule.HubResponse();
		var response = null;
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
			if (result == null) {
				response = hubResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);
			} else {
				response = hubResponse.getOkResponse();
				var ThirdPartyUserSub = null;
				if (req.query.substring != null) {
					ThirdPartyUserSub = req.query.substring;
				}
				ThirdPartyUserManager.getThirdPartyUserCount(ThirdPartyUserSub, function (err, count) {
					if (err != null) {
						response = hubResponse.getErrorResponse(-1, "Invalid request from client");
						res.end(response);
					} else {
						hubResponse = new responseModule.HubResponse();
						var response = null;
						console.log('ThirdPartyUser count ', count);
						hubResponse.data = { ThirdPartyUserCount: count };
						response = hubResponse.getOkResponse();
						res.end(response);
					}
				});
			}
		});
	});

	express.get('/thirdpartyuser/:index/', function (req, res) {
		console.log('query ', req.query);
		console.log('param ', req.params.index);
		var hubResponse = new responseModule.HubResponse();
		var response = null;
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function(result) {
			if(result == 'failed'){
				response = hubResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);
			} else{
				ThirdPartyUserManager.getThirdPartyUserAt(req.query, req.params.index, function (result) {
					var hubResponse = new responseModule.HubResponse();
					var response = null;
					console.log(result)
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

	express.delete('/thirdpartyuser', function (req, res) {
		console.log('Delete request:query=', req.query);
		var slpResponse = new responseModule.HubResponse();
		var response = null
		requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
			if (result == null) {
				response = slpResponse.getErrorResponse(-1, "Invalid request from client");
				res.end(response);

			}
			else {
				ThirdPartyUserManager.removeThirdPartyUser(req.query.uName, function (err) {
					var slpResponse = new responseModule.HubResponse();
					var response = null;
					if (err) {
						response = slpResponse.getErrorResponse(-1, "Error occured in deleting ThirdPartyUser");
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
	ThirdPartyUserApi
}