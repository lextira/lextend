var path = require('path');
var express = new require('express');
const helmet= new require('helmet');
//const csrf = require('csurf');
var app = new require('express')();
app.use(helmet());
//app.use(csrf());
/*
const rateLimit = new require("express-rate-limit");
 
const apiLimiter = rateLimit({
    windowMs:1000*60*60,
    max:100,
  
});
app.use(apiLimiter);
*/
var bodyParser = require('body-parser')
// express.use(bodyParser.json())
app.use(bodyParser.json({limit: '50mb'}))

app.use(express.static(path.join(__dirname, 'public')));

	var server = app.listen(4001, function () 
	{
	   var host = server.address().address
	   var port = server.address().port

	});

console.log("server.js running");
