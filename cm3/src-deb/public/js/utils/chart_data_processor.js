function ChartDataProcessor() {
    this.valuesPerParams = [];
    this.xAxisPerParams = [];
    this.xAxisPerParamsDateInfo = [];

    this.formatDate = function (date) {
        var monthNames = [
          "Jan", "Feb", "Mar",
          "Apr", "May", "Jun", "Jul",
          "Aug", "Sep", "Oct",
          "Nov", "Dec"
        ];

        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();

        return day + '/' + monthNames[monthIndex] + '/' + (year % 100);
    }
    this.padDigits = function (number, digits) {
        return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
    }
    this.addParamValue = function (paramName, value, timeEpoch) {

        if (this.valuesPerParams[paramName] == null) {
            this.valuesPerParams[paramName] = [];
            this.xAxisPerParams[paramName] = [];
            this.xAxisPerParamsDateInfo[paramName] = [];
        }
        this.valuesPerParams[paramName].push(value);
        var d = new Date(timeEpoch);

        var xLabel = this.formatDate(d);
        var previousData = null;
        if (this.xAxisPerParamsDateInfo[paramName].length > 0) {
            previousData = this.xAxisPerParamsDateInfo[paramName][this.xAxisPerParamsDateInfo[paramName].length - 1];
        }

        if (previousData != null && previousData.getDate() == d.getDate() &&
            previousData.getFullYear() == d.getFullYear() &&
            previousData.getMonth() == d.getMonth()) {
            xLabel = this.padDigits(d.getHours(), 2) + ":" + this.padDigits(d.getMinutes(), 2) + ":" + this.padDigits(d.getSeconds(), 2);
        }
        else {
            xLabel += " " + this.padDigits(d.getHours(), 2) + ":" + this.padDigits(d.getMinutes(), 2) + ":" + this.padDigits(d.getSeconds(), 2);
        }

        this.xAxisPerParams[paramName].push(xLabel);
        this.xAxisPerParamsDateInfo[paramName].push(d);
    }

    this.addParamValueEx = function (paramName, value, xAxisTimeLabelValue) {

        if (this.valuesPerParams[paramName] == null) {
            this.valuesPerParams[paramName] = [];
            this.xAxisPerParams[paramName] = [];
        }
        this.valuesPerParams[paramName].push(value);

        this.xAxisPerParams[paramName].push(xAxisTimeLabelValue.replace('.', '/').replace('.', '/'));
    }

    this.getXAxisLabelsForParam = function (paramName) {

        var result = [];
        if (this.xAxisPerParams[paramName] != null) {
            result = this.xAxisPerParams[paramName];
        }

        return result;
    }


    this.getValuesForParam = function (paramName) {

        var result = [];
        if (this.valuesPerParams[paramName] != null) {
            result = this.valuesPerParams[paramName];
        }

        return result;
    }

    this.clear = function () {
        this.xAxisPerParams = [];
        this.valuesPerParams = [];
    }
}
