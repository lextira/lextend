var moment = require('moment-timezone');

function DateUtils()
{
    this.convertDateToTimeZone= function(dateObj,timeZoneName)
    {
        var res = dateObj;
        if (timeZoneName != null)
        {
            var mtz = moment.tz(timeZoneName);//
            //mtz.utcOffset() * 60000
            var zoneChanged = moment.tz(dateObj.valueOf() , timeZoneName);//

            var date = zoneChanged.date();
            var year = zoneChanged.year();
            var month = zoneChanged.month();
           // console.log("&&&&&&&&&&&&&&&&&&&");
            //console.log("&&&&&&&&&&&&&&&&&&& date", date, mtz.utcOffset());
            
            res = new Date(year, month, date);
            var currentEpoch = res.valueOf();
            console.log("&&&&&&&&&&&&&&&&&&& currentEpoch ", currentEpoch);
            res = new Date(currentEpoch - (mtz.utcOffset() * 60000));
            //console.log("&&&&&&&&&&&&&&&&&&& res.epoch", res.valueOf());
            //console.log("&&&&&&&&&&&&&&&&&&&");
        }
        return res;
    }
    this.dateToDailyUsageKey = function(dateObj,timeZoneName)
    {

        var date = dateObj.getDate();
        var year = dateObj.getFullYear();
        var month = dateObj.getMonth() + 1;

        if (timeZoneName != null) {
            var zoneChanged = moment.tz(dateObj.valueOf(), timeZoneName);//

            date = zoneChanged.date();
            year = zoneChanged.year();
            month = zoneChanged.month()+1;
        }

        var result = date + "." + month + "." + year;
        return result;
    }

    this.dateToMonthlyUsageKey = function (dateObj, timeZoneName) {
        var year = dateObj.getFullYear();
        var month = dateObj.getMonth() + 1;

        if (timeZoneName != null) {

            var zoneChanged = moment.tz(dateObj.valueOf(), timeZoneName);//
            year = zoneChanged.year();
            month = zoneChanged.month() + 1;
        }

        var result =  month + "." + year;
        return result;
    }

    this.dateToYearlyUsageKey = function (dateObj, timeZoneName) {
        var year = dateObj.getFullYear();

        if (timeZoneName != null) {

            var zoneChanged = moment.tz(dateObj.valueOf(), timeZoneName);//
            year = zoneChanged.year();
        }


        var result =  year;
        return result;
    }
    
}





// export the class
module.exports =
 {
     DateUtils
 };
