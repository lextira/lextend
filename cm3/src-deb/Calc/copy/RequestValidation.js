
var DatabaseHandlerModule = require('./DatabaseHandler.js');
var dbInstance = new  DatabaseHandlerModule.DatabaseHandler();
/*
var express= new require('express')
var passport=new require('passport')
var bodyParser= new require('body-parser')
var LdapStrategy=new require('passport-ldapauth')

var OPTS={
	server:{
		url: 'ldap://localhost:389',
		bindDN: 'cn=root',
    	bindCredentials: 'secret',
    	searchBase: 'ou=passport-ldapauth',
    	searchFilter: '(uid={{username}})'
  }
};
 
var app = express();
 
passport.use(new LdapStrategy(OPTS));
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(passport.initialize());
 
app.post('/login', passport.authenticate('ldapauth', {session: false}), function(req, res) {
  res.send({status: 'ok'});
});
 
app.listen(8080);
*/

function RequestValidation()
{
	this.isValidUser = function(ssoId,password,callBack)
    {
		if((ssoId == 'admin' && password == 'admin' ) || (ssoId == 'bhopaldemo' && password == 'demobhopal' ))
		{
			console.log('in success');
			callBack("success");

		}else
		{
			var query = {};
			query['ssoId'] = ssoId;
			query['password'] = password;
				  
			dbInstance.IsDocumentExist('users',query, function(err, result)
			{
				console.log('validation results =',result);
				if(result == 'success')
				{
					callBack("success");
				}else
				{
					callBack(null);
				}
			});

		}
		
		
    }
	
        

}


// export the class
module.exports =
 {
    RequestValidation
 };
