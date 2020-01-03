var AlarmProcessorModule = require('./Alarm/AlarmProcessor.js');
var alarmProcessor = new AlarmProcessorModule.AlarmProcessor();

var AlarmManagerModule = require('./Alarm/AlarmManager.js');
var alarmManager = new AlarmManagerModule.AlarmManager();


console.log('starting alarm service server ');

//alarmManager.getAlarmRecordWithLiveLogTimeStamp(14923595109326, function (err, ress) {
//    console.log("##################################",ress);
//})

//alarmProcessor.process(function () {

//    console.log("processing completed");
//})


var interval = setInterval(function () {
    
    console.log("processing alarms");
    alarmProcessor.process(function () {

        console.log("processing completed");
    })

}, 15000);

