var userModule = require('./User.js')
UserFactoryModule = require('./UserFactory.js')
var userFactory = new UserFactoryModule.UserFactory()

var DatabaseHandlerModule = require('../DatabaseHandler.js')
var dbInstance = new DatabaseHandlerModule.DatabaseHandler()

function UserManager() {

	this.saveUser = function (userDetails, callBack) {

		var user = null;
		user = userFactory.createUserInstance(userDetails);
		user.parse(userDetails);

		var query = {};
		query['userName'] = userDetails.userName;
		dbInstance.IsDocumentExist('users', query, function (err, result) {
			console.log('validation results =', result);
			if (result != 'success') {
				dbInstance.insertDocument('users', user);
				callBack("success");
			} else {
				console.log('document with projectId already exist adding failed');
				callBack("failed");
			}
		});
	}

	this.getUserCount = function (query, callback) {
		var userQuery;
		console.log("reached GETUSERCOUNT")
		if (query != null) {
			userQuery = {};
		}
		dbInstance.getDocumentCountByCriteria('users', userQuery, function (err, count) {
			if (err) {
				callback(1, 0);
				console.log("errror displayed GETUSERCOUNT")
			} else {
				console.log('Document Count: ' + count);
				callback(null, count);
			}
		});
	};

	this.getUserAt = function (query, index, callBack) {
		var userQuery ={};
		console.log("reached GETUSERAT")
		if (query != null && query.hasOwnProperty('substring')) {
			console.log('query.substring =', query.substring);
			var substring = query.substring;
			var regExp = new RegExp(".*" + substring + ".*");
			console.log('regular expression = ', regExp);
			userQuery = {};
		}

		dbInstance.GetDocumentByCriteria('users', index, userQuery, function (err, result) {

			if (err) {
				callBack(null);
				console.log("ERROR GETUSERAT ")
			}
			else {
				callBack(result);
				console.log("userresult",result)
			}

		});

	};
	this.updateUser = function (userDetails,callBack) {

	    var user = null;
	    console.log("value of USERDEATILS IN USERMANAGER userDetails",userDetails)
	    //user.parse(userDetails);
		user=userDetails
		
	    var query = {};
	    query['userName'] = user.oldUserName;
	    var myInstance = this;
		delete user.oldUserName



	    dbInstance.GetDocumentByName('users', query, function (err, oldUser)
	    {

	        if (err)
	        {
	            callBack(1, "No user found");
	        }
	        else
	        {
	            dbInstance.updateDocument('users', query, user,function(err1){


	                if (err1) {
	                    callBack(1, "Error occured while updating user");
	                }
	                else
	                {
	                    callBack(null, "user update");
	                }
	            });
	        }
	    });
	}

	this.removeUser = function(uName,callBack)
	{
		var query = {};
		query['userName'] = uName;

		dbInstance.GetDocumentByName('users',query,function(err, result)
        {
			if(err)
			{
				 callBack(1);
			}else
			{
				if(result != null)
				{
					dbInstance.removeDocument('users',query,function(err1){
						if(err1){
							callBack(1, "Error occured while deleting")
						}
						else{
							callBack(null,"user delete")
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
	
	this.isUserExist = function(query, callBack){

		dbInstance.IsDocumentExist('users',query,function(err,result){
			
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

	UserManager
}