var ThirdPartyUserModule = require('./ThirdPartyUser.js')
ThirdPartyUserFactoryModule = require('./ThirdPartyUserFactory.js')
var ThirdPartyUserFactory = new ThirdPartyUserFactoryModule.ThirdPartyUserFactory()

var DatabaseHandlerModule = require('../DatabaseHandler.js')
var dbInstance = new DatabaseHandlerModule.DatabaseHandler()

function ThirdPartyUserManager() {

	this.saveThirdPartyUser = function (ThirdPartyUserDetails, callBack) {

		var ThirdPartyUser = null;
		ThirdPartyUser = ThirdPartyUserFactory.createThirdPartyUserInstance(ThirdPartyUserDetails);
		ThirdPartyUser.parse(ThirdPartyUserDetails);
		console.log(ThirdPartyUser)
		var query = {};
		query['name'] = ThirdPartyUserDetails.name;
		dbInstance.IsDocumentExist('ThirdPartyUsers', query, function (err, result) {
			console.log('validation results =', result);
			if (result != 'success') {
				dbInstance.insertDocument('ThirdPartyUsers', ThirdPartyUser);
				callBack("success");
			} else {
				console.log('document with projectId already exist adding failed');
				callBack("failed");
			}
		});
	}

	this.getThirdPartyUserCount = function (query, callBack) {
		var ThirdPartyUserQuery;
		if (query != null) {
			ThirdPartyUserQuery = {};
		}
		dbInstance.getDocumentCountByCriteria('ThirdPartyUsers', ThirdPartyUserQuery, function (err, count) {
			if (err) {
				callBack(1, 0);
			} else {
				console.log('Document Count: ' + count);
				callBack(null, count);
			}
		});
	};

	this.getThirdPartyUserAt = function (query, index, callBack) {
		var ThirdPartyUserQuery ={};
		if (query != null && query.hasOwnProperty('substring')) {
			console.log('query.substring =', query.substring);
			var substring = query.substring;
			var regExp = new RegExp(".*" + substring + ".*");
			console.log('regular expression = ', regExp);
			ThirdPartyUserQuery = {};
		}

		dbInstance.GetDocumentByCriteria('ThirdPartyUsers', index, ThirdPartyUserQuery, function (err, result) {

			if (err) {
				callBack(null);
			}
			else {
				callBack(result);
				console.log("result",result)
			}

		});

	};
	
	this.removeThirdPartyUser = function(uName,callBack)
	{
		var query = {};
		query['name'] = uName;

		dbInstance.GetDocumentByName('ThirdPartyUsers',query,function(err, result)
        {
			if(err)
			{
				 callBack(1);
			}else
			{
				if(result != null)
				{
				    
			
					dbInstance.removeDocument('ThirdPartyUsers',query,function(err1){
						if(err1){
							callBack(1, "Error occured while deleting")
						}
						else{
							callBack(null,"ThirdPartyUser delete")
						}
					}
					
					
					)}
                else
				{
					callBack(1);
				}
				
			}
					
        });
	};
	
	this.isThirdPartyUserExist = function(query, callBack){

		dbInstance.IsDocumentExist('ThirdPartyUsers',query,function(err,result){
			
			if (err) {
				callBack(null);
			}
			else {
				callBack(result);
			}
		});
		
	}

    
}

module.exports = {

	ThirdPartyUserManager
}