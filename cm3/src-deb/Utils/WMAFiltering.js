
function WMAFiltering()
{

    this.name = "WMAFilter";

    this.getParamDefClass = function (to,t1) {

        var def = {

            weightT0: to,
            weightT1: t1
        }

        return def;
    }
    this.parse = function (params) {

        this.weightT0 = params.weightT0;
        this.weightT1 = params.weightT1;

    }
    this.filter = function (oldValue, newValue) {

        return oldValue * this.weightT0 + newValue * this.weightT1;
    }
    
}





// export the class
module.exports =
 {
     WMAFiltering
 };
