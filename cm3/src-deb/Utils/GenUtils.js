
function GenUtils()
{
    this.isNumber = function(val)
    {
        var res = val.substring;
        return !res;
    }
    this.padDigits = function(number, digits) {
        return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
    }

}





// export the class
module.exports =
 {
     GenUtils
 };
