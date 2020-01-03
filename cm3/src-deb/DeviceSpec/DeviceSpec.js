function DeviceSpec() {


    this.id = null;
    
}

DeviceSpec.prototype.toJson = function () {
    return JSON.stringify(this);
}

//DeviceSpec.prototype.parse = function (spec) {
//    this.type = spec.type;
//}

// export the class
module.exports =
 {
     DeviceSpec
 };
