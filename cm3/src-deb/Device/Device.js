function Device() {


    this.logicalDeviceId = null;
    this.deviceId = 0;
    this.type = null;
    this.devFamily = null;
    this.subType = null;
    this.registerFrom = null;
    this.registerTo = null;
    this.customerName = null;
    this.lotNo = null;
    this.serialNo = null;
    this.grade = null;
    this.deployment = null;
    this.location = null;
    this.timeZone = null;

    this.toJson = function () {
        return JSON.stringify(this);
    }

    
}

Device.prototype.toJson = function () {
    return JSON.stringify(this);
}

Device.prototype.parse = function (deviceDetails) {
    this.deviceId = deviceDetails.deviceId;
    if (deviceDetails.logicalDeviceId == null) {
        this.logicalDeviceId = deviceDetails.deviceId + "_L";
    }
    else
    {
        this.logicalDeviceId = deviceDetails.logicalDeviceId;
    }
    this.type = deviceDetails.type;
    this.devFamily = deviceDetails.devFamily;
    this.subType = deviceDetails.subType;
    this.registerFrom = deviceDetails.registerFrom;
    this.registerTo = deviceDetails.registerTo;
    this.timeZone = deviceDetails.timeZone;
    this.customerName = deviceDetails.customerName;
    this.lotNo = deviceDetails.lotNo;
    this.serialNo = deviceDetails.serialNo;
    this.grade = deviceDetails.grade;
    this.deployment = deviceDetails.deployment;
    this.location = deviceDetails.location;
    this.description = deviceDetails.description;

}


// export the class
module.exports =
 {
     Device
 };
