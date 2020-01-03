
var  responseModule =  require('../HubResponse');

var  requestValidationModule =  require('../RequestValidation.js');
var requestValidation = new  requestValidationModule.RequestValidation();

var AlarmManagerModule = require('../Alarm/AlarmManager.js');
var alarmManager = new AlarmManagerModule.AlarmManager();

function AlarmApi(express)
{

console.log("alarmApi")
    express.put('/alarm/rules/device', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {

                alarmManager.updatAlarmRule(req.body, function (err) {
                    if (err != null) {
                        res.end(hubResponse.getErrorResponse(-2, "Invalid data or rule not exists."));
                    }
                    else {
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });


    });

    express.post('/alarm/rules/device', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else {

                if (req.body != null) {

                    console.log("alarm post", req.body);
                    alarmManager.addAlarmRule(req.body, function (err) {

                        var hubResponse = new responseModule.HubResponse();
                        var response = null;
                        if (!err) {
                            hubResponse.message = "alarm rule added successfully";
                            res.end(hubResponse.getOkResponse());
                        }
                        else {
                            res.end(hubResponse.getErrorResponse(-1, "A rule with same name already exist"));
                        }
                    });
                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request from client"));
                }
            }
        });

    });


    express.delete('/alarm/rules/device', function (req, res) {

        var slpResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == null) {
                response = slpResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else {

                if (req.query.ruleName == null) {
                    res.end(slpResponse.getErrorResponse(-2, "ruleName is missing"));
                }
                else {
                    alarmManager.removeAlarmRule(req.query.ruleName, function (err) {
                        var slpResponse = new responseModule.HubResponse();
                        var response = null;
                        if (err) {
                            response = slpResponse.getErrorResponse(-1, "Error occured in deleting device");
                        }
                        else {
                            response = slpResponse.getOkResponse();
                        }
                        res.end(response);
                    });
                }
            }
        });

    });


    express.put('/alarm/records', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {

                alarmManager.updateAlarmRecords(req.body,function (err) {
                    if (err != null) {
                        res.end(hubResponse.getErrorResponse(-1, "Invalid data"));
                    }
                    else {
                        res.end(hubResponse.getOkResponse());
                        console.log("put /alarm/records", req.body);
                    }
                });

            }
        });


    });

    express.get('/alarm/records', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {
                response = hubResponse.getOkResponse();
                
                req.query.limit =  (req.query.limit == null) ? 100 : parseInt(req.query.limit);
                req.query.offset = (req.query.offset == null) ? 0 : parseInt(req.query.offset);

                alarmManager.getAlarmRecords(req.query.ruleName, req.query.limit, req.query.offset, null,null,function (err, info) {
                    if (err != null) {
                        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                        res.end(response);
                    }
                    else {
            
            
               for(var i =0;i<info.length;i++){
                var num;
               
                var t=function(num){
                deviceId = info[num].liveLog[0]["deviceId"];
                if(deviceId){
                    alarmManager.getDeviceLocation(deviceId, function(err,loc){
                           
                        info[num].liveLog[0]["location"] = loc;
                        
                        if( info[info.length-1].liveLog[0].location != null ){
                            hubResponse = new responseModule.HubResponse();
                            hubResponse.data = info;
                            res.end(hubResponse.getOkResponse());
                            console.log("get /alarm/records", req.body);
                        }
                    })
                }
                else{
                    console("No device id");
                }

               }
               t(i);
            }
                    }
                    
                });

            }
        });


    });


    express.get('/alarm/records/count', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {
                response = hubResponse.getOkResponse();

                alarmManager.getAlarmRecordsCount(req.query.ruleName, function (err, count) {
                    if (err != null) {
                        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                        res.end(response);
                    }
                    else {
                        hubResponse = new responseModule.HubResponse();
                        hubResponse.data = { recordCount: count };
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });
    });

    express.get('/alarm/rules/device/count', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {
                response = hubResponse.getOkResponse();
                
                alarmManager.getAlarmRuleCount(req.query.type, function (err, count) {
                    if (err != null) {
                        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                        res.end(response);
                    }
                    else {
                        hubResponse = new responseModule.HubResponse();
                        hubResponse.data = { ruleCount: count };
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });

    });


    express.get('/alarm/rules/device/:index/', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == 'failed') {
                res.end(hubResponse.getErrorResponse(-1, "Invalid request from client"));

            } else {
                alarmManager.getAlarmRuleAt(req.query.type, req.params.index, function (result) {
                    var hubResponse = new responseModule.HubResponse();
                    var response = null;
                    if (result != null) {
                        hubResponse.data = result;
                        response = hubResponse.getOkResponse();
                    }
                    else {
                        response = hubResponse.getErrorResponse(-1, "Not found");
                    }
                    res.end(response);
                });
            }
        });

    });
}

// export the class
module.exports =
{
    AlarmApi
};



















/*
var  responseModule =  require('../HubResponse');

var  requestValidationModule =  require('../RequestValidation.js');
var requestValidation = new  requestValidationModule.RequestValidation();

var AlarmManagerModule = require('../Alarm/AlarmManager.js');
var alarmManager = new AlarmManagerModule.AlarmManager();

function AlarmApi(express)
{


    express.put('/alarm/rules/device', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {

                alarmManager.updatAlarmRule(req.body, function (err) {
                    if (err != null) {
                        res.end(hubResponse.getErrorResponse(-2, "Invalid data or rule not exists."));
                    }
                    else {
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });


    });

    express.post('/alarm/rules/device', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == null) {
                var response = null;
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else {

                if (req.body != null) {

                    console.log("alarm post", req.body);
                    alarmManager.addAlarmRule(req.body, function (err) {

                        var hubResponse = new responseModule.HubResponse();
                        var response = null;
                        if (!err) {
                            hubResponse.message = "alarm rule added successfully";
                            res.end(hubResponse.getOkResponse());
                        }
                        else {
                            res.end(hubResponse.getErrorResponse(-1, "A rule with same name already exist"));
                        }
                    });
                }
                else {
                    res.end(hubResponse.getErrorResponse(-1, "Invalid request from client"));
                }
            }
        });

    });


    express.delete('/alarm/rules/device', function (req, res) {

        var slpResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == null) {
                response = slpResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            }
            else {

                if (req.query.ruleName == null) {
                    res.end(slpResponse.getErrorResponse(-2, "ruleName is missing"));
                }
                else {
                    alarmManager.removeAlarmRule(req.query.ruleName, function (err) {
                        var slpResponse = new responseModule.HubResponse();
                        var response = null;
                        if (err) {
                            response = slpResponse.getErrorResponse(-1, "Error occured in deleting device");
                        }
                        else {
                            response = slpResponse.getOkResponse();
                        }
                        res.end(response);
                    });
                }
            }
        });

    });


    express.put('/alarm/records', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {

                alarmManager.updateAlarmRecords(req.body,function (err) {
                    if (err != null) {
                        res.end(hubResponse.getErrorResponse(-1, "Invalid data"));
                    }
                    else {
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });


    });
	
	
	express.get('/alarm/records/v1', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {
                response = hubResponse.getOkResponse();
                
                req.query.limit =  (req.query.limit == null) ? 100 : parseInt(req.query.limit);
                req.query.offset = (req.query.offset == null) ? 0 : parseInt(req.query.offset);

                alarmManager.getAlarmRecords(req.query.ruleName, req.query.limit, req.query.offset, null,null,function (err, info) {
                    if (err != null) {
                        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                        res.end(response);
                    }
                    else {
                        hubResponse = new responseModule.HubResponse();
                        hubResponse.data = info;
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });


    });
	

    express.get('/alarm/records', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {
                response = hubResponse.getOkResponse();
                
                req.query.limit =  (req.query.limit == null) ? 100 : parseInt(req.query.limit);
                req.query.offset = (req.query.offset == null) ? 0 : parseInt(req.query.offset);

                alarmManager.getAlarmRecords(req.query.ruleName, req.query.limit, req.query.offset, null,null,function (err, info) {
                    if (err != null) {
                        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                        res.end(response);
                    }
                    else {
                        hubResponse = new responseModule.HubResponse();
                        hubResponse.data = info;
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });


    });
	
	
	express.get('/alarm/records/v1/count', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {
                response = hubResponse.getOkResponse();

                alarmManager.getAlarmRecordsCount(req.query.ruleName, function (err, count) {
                    if (err != null) {
                        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                        res.end(response);
                    }
                    else {
                        hubResponse = new responseModule.HubResponse();
                        hubResponse.data = { recordCount: count };
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });
    });
	

    express.get('/alarm/records/count', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {
                response = hubResponse.getOkResponse();

                alarmManager.getAlarmRecordsCount(req.query.ruleName, function (err, count) {
                    if (err != null) {
                        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                        res.end(response);
                    }
                    else {
                        hubResponse = new responseModule.HubResponse();
                        hubResponse.data = { recordCount: count };
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });
    });

    express.get('/alarm/rules/device/count', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        var response = null;
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {

            if (result == null) {
                response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                res.end(response);

            } else {
                response = hubResponse.getOkResponse();
                
                alarmManager.getAlarmRuleCount(req.query.type, function (err, count) {
                    if (err != null) {
                        response = hubResponse.getErrorResponse(-1, "Invalid request from client");
                        res.end(response);
                    }
                    else {
                        hubResponse = new responseModule.HubResponse();
                        hubResponse.data = { ruleCount: count };
                        res.end(hubResponse.getOkResponse());
                    }
                });

            }
        });

    });


    express.get('/alarm/rules/device/:index/', function (req, res) {

        var hubResponse = new responseModule.HubResponse();
        requestValidation.isValidUser(req.query.userId, req.query.authPassword, function (result) {
            if (result == 'failed') {
                res.end(hubResponse.getErrorResponse(-1, "Invalid request from client"));

            } else {
                alarmManager.getAlarmRuleAt(req.query.type, req.params.index, function (result) {
                    var hubResponse = new responseModule.HubResponse();
                    var response = null;
                    if (result != null) {
                        hubResponse.data = result;
                        response = hubResponse.getOkResponse();
                    }
                    else {
                        response = hubResponse.getErrorResponse(-1, "Not found");
                    }
                    res.end(response);
                });
            }
        });

    });
}

// export the class
module.exports =
{
    AlarmApi
};
*/



