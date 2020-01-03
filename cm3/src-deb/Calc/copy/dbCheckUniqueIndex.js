
var DatabaseHandlerModule = require('./DatabaseHandler.js');
var dbInstance = new  DatabaseHandlerModule.DatabaseHandler();

var item = {
	name : "kd1",
	age  : "21",
	value : "sss"
};

dbInstance.createUniqueIndex( "must",{ name: 1, age: 1 },function(errIndex,nameIndex){


console.log("index creation",errIndex,nameIndex);
dbInstance.insertDocument("must", item);


} );



