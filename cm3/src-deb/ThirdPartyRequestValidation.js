var DatabaseHandlerModule = require('./DatabaseHandler.js');
var dbInstance = new  DatabaseHandlerModule.DatabaseHandler();

function ThirdPartyRequestValidation()
{
	this.isValidThirdPartyuser=function(apikey,callBack)
	{
		var query = {};
			
			query['apikey'] = apikey;
				  
			dbInstance.IsDocumentExist('ThirdPartyUsers',query, function(err, result)
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

module.exports={
    ThirdPartyRequestValidation
}