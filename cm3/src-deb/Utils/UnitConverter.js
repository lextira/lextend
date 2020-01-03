var moment = require('moment-timezone');

function UnitConverter()
{
    this.convertPM10u3ToAqi = function (value) {
/*old
        if (value <= 50)
            return value;
        if (value > 50 && value <= 100)
            return value;
        if (value > 100 && value <= 250)
            return 100 + (value - 100) * 100 / 150;
        if (value > 250 && value <= 350)
            return 200 + (value - 250);
        if (value > 350 && value <= 430)
            return 300 + (value - 350) * (100 / 80);
        if (value > 430)
            return 400 + (value - 430) * (100 / 80)
    }
*/
        if (value <= 50)
            return value;
        if (value > 50 && value <= 100)
            return value;
        if (value > 100 && value <= 250)
            return 100 + (value - 100) * 100 / 150;
        if (value > 250 && value <= 350)
            return 200 + (value - 250);
        if (value > 350 && value <= 430)
            return 300 + (value - 350) * (100 / 80);
        if (value > 430 && value <= 510)
            return 400 + (value - 430) * (100 / 80);
/*            if (value > 430)
            return 400 + (value - 430) * (100 / 80)
*/
        if (value > 510)
            return (500);
        }

    this.convertPM25u3ToAqi = function (value) {

        if (value <= 30)
            return value * 50 / 30;
        if (value > 30 && value <= 60)
            return 50 + (value - 30) * 50 / 30;
        if (value > 60 && value <= 90)
            return 100 + (value - 60) * 100 / 30;
        if (value > 90 && value <= 120)
            return 200 + (value - 90) * 100 / 30;
        if (value > 120 && value <= 250)
            return 300 + (value - 120) * 100 / 130;
       /* if (value > 250)
            return 400 + (value - 250) * 100 / 130; */
        if (value > 250 && value <= 380)
            return 400 + (value - 250) * 100 / 130;
        if (value > 380)
            return (500);
    }

    this.convertSO2u3ToAqi = function (value) {

        if (value <= 40)
            return value * 50 / 40;
        if (value > 40 && value <= 80)
            return 50 + (value - 40) * 50 / 40;
        if (value > 80 && value <= 380)
            return 100 + (value - 80) * 100 / 300;
        if (value > 380 && value <= 800)
            return 200 + (value - 380) * (100 / 420);
        if (value > 800 && value <= 1600)
            return 300 + (value - 800) * (100 / 800)
       /* if (value > 1600)
            return 400 + (value - 1600) * (100 / 800);*/
        if (value > 1600 && value <= 2400)
            return 400 + (value - 1600) * (100 / 800)
        if (value > 2400)
            return (500);
    }

    this.convertNoXu3ToAqi = function (value) {
        if (value <= 40)
            return value * 50 / 40;
        if (value > 40 && value <= 80)
            return 50 + (value - 40) * 50 / 40;
        if (value > 80 && value <= 180)
            return 100 + (value - 80) * 100 / 100;
        if (value > 180 && value <= 280)
            return 200 + (value - 180) * 100 / 100;
        if (value > 280 && value <= 400)
            return 300 + (value - 280) * (100 / 120);
       /* if (value > 400)
            return 400 + (value - 400) * (100 / 120);*/
        if (value > 400 && value <= 520)
            return 400 + (value - 400) * (100 / 120);
        if (value > 520)
            return (500);
    }

    this.convertCOu3ToAqi = function (value) {
        if (value <= 1)
            return value * 50 / 1;
        if (value > 1 && value <= 2)
            return 50 + (value - 1) * 50 / 1;
        if (value > 2 && value <= 10)
            return 100 + (value - 2) * 100 / 8;
        if (value > 10 && value <= 17)
            return 200 + (value - 10) * (100 / 7);
        if (value > 17 && value <= 34)
            return 300 + (value - 17) * (100 / 17);
      /*  if (value > 34)
            return 400 + (value - 34) * (100 / 17)*/
        if (value > 34 && value <= 51)
            return 400 + (value - 34) * (100 / 17)

        if (value > 51)
            return (500);
    }

    this.convertO3u3ToAqi = function (value) {

        if (value <= 50)
            return value * 50 / 50;
        if (value > 50 && value <= 100)
            return 50 + (value - 50) * 50 / 50
        if (value > 100 && value <= 168)
            return 100 + (value - 100) * 100 / 68;
        if (value > 168 && value <= 208)
            return 200 + (value - 168) * (100 / 40);
        if (value > 208 && value <= 748)
            return 300 + (value - 208) * (100 / 539);
       /* if (value > 748)
            return 400 + (value - 400) * (100 / 539)*/
        if (value > 748 && value <= 939)
            return 400 + (value - 400) * (100 / 539)
        if (value > 939)
            return (500);
    }

    this.convertNH3u3ToAqi = function (value) {

        if (value <= 200)
            return value * 50 / 200;
        if (value > 200 && value <= 400)
            return 50 + (value - 200) * 50 / 200;
        if (value > 400 && value <= 800)
            return 100 + (value - 400) * 100 / 400;
        if (value > 800 && value <= 1200)
            return 200 + (value - 800) * (100 / 400);
        if (value > 1200 && value <= 1800)
            return 300 + (value - 1200) * (100 / 600)
       /* if (value > 1800)
            return 400 + (value - 1800) * (100 / 600);
        */
        if (value > 1800 && value <= 2400)
            return 400 + (value - 1800) * (100 / 600);
        if (value > 2400)
            return (500);
//need to add C6H6 and AsH3
    }
//convertion for c6H6
//no standards defined for India. So standards taken from Poland.
    this.convertC6H6u3ToAqi = function (value) {

        if (value <= 5)
            return value * 50/5;
        if (value > 5 && value <= 10)
            return 50 + (value - 5) * 50 / 5;
        if (value > 10 && value <= 15)
            return 100 + (value - 10) * 100 / 5;
        if (value > 15 && value <= 20)
            return 200 + (value - 15) * (100 / 5);
        if (value > 20 && value <= 50)
            return 300 + (value - 20) * (100 / 30)
        /*if (value > 50)
            return 400 + (value - 50) * (100 / 30);*/
        if (value > 50 && value <= 80)
            return 400 + (value - 50) * (100 / 30);
        if (value > 80)
            return (500);

    }
    /*
//convertion for AsH3
    this.convertAsH3u3ToAqi = function (value) {

        if (value <= 200)
            return value * 50 / 200;
        if (value > 200 && value <= 400)
            return 50 + (value - 200) * 50 / 200;
        if (value > 400 && value <= 800)
            return 100 + (value - 400) * 100 / 400;
        if (value > 800 && value <= 1200)
            return 200 + (value - 800) * (100 / 400);
        if (value > 1200 && value <= 1800)
            return 300 + (value - 1200) * (100 / 600)
        if (value > 1800)
            return 400 + (value - 1800) * (100 / 600);


    }
    */

    this.convertUgM3ToAqi = function (paramName, value) {

        var result = 0;
        var temp = paramName.toUpperCase();

        var paramFuncs = {
            //C02: 44.01,
            SO2: this.convertSO2u3ToAqi,
            CO: this.convertCOu3ToAqi,
            O3: this.convertO3u3ToAqi,
            NH3: this.convertNH3u3ToAqi,
          //  O3: 48,
            NO2: this.convertNoXu3ToAqi,
            PM10: this.convertPM10u3ToAqi,
            PM2P5: this.convertPM25u3ToAqi,
            C6H6 : this.convertC6H6u3ToAqi
            
            //need to add C6H6 and AsH3
            
        }
       // console.log("C6H6ug" +C6H6);

        if (paramFuncs[temp] != null) {
            if (paramName == "CO")
            {
                value = value / 1000; // for CO value should be mg/m3
            }
            result = paramFuncs[temp](value);
        }
        if (paramFuncs[temp] != null) {
            if (paramName == "AsH3")
            {
                value = value * 1000; 
            }
            result = paramFuncs[temp](value);
        }
       // console.log("C6H6ug" +C6H6);
        return result;
        
    }
    this.convertPPMtoUgM3= function(parameterName,value,pressure,temp)
    {
        // If the value is not avaiable then use temp as 25 and pressure as 0.986923atm or 1 bar o. 
        if (pressure == null)
            pressure = 0.986923;

        if (temp == null)
            temp = 25;

        var res = value;
        var molWeights = {
            C02: 44.01,
            SO2: 64.066,
            CO: 28.01,
            O3: 48,
            NH3: 17.031,
            O3: 48,
            NO2: 46.0055,
            C6H6:78.11,
            ASH3:77.95
        }

        if (molWeights[parameterName] != null)
        {
            var denom = ((pressure / 1) * (273.15 + temp));
            res = (value*molWeights[parameterName] * 1013.25 * 12.1875) / denom;
            //res = ((value * molWeights[parameterName]) / 24.45 ) * 1000;
        }

        return res;

        //data1$NO2_ug_m3 <- ((data1_ppm$NO2*46.0055*1013.25*12.1875)/((data1$presssure/1000)*(273.15+data1$temperature)))
        //data1$SO2_ug_m3 <- ((data1$SO2_ppm*64.066*1013.25*12.1875)/((data1$presssure/1000)*(273.15+data1$temperature)))
        //data1$CO_ug_m3 <- ((data1$CO_ppm*28.01*1013.25*12.1875)/((data1$presssure/1000)*(273.15+data1$temperature)))
        //data1$O3_ug_m3 <- ((data1$O3_ppm*48*1013.25*12.1875)/((data1$presssure/1000)*(273.15+data1$temperature)))
       
    }
   
    
}





// export the class
module.exports =
 {
     UnitConverter
 };
