var uuidv1=require('uuid/v1')
function ThirdPartyUser() {

    this.name = null;
    this.limit=null;
    this.apikey = null;
    

    this.toJson = function () {
        return JSON.stringify(this)
    }


}

ThirdPartyUser.prototype.toJson = function () {
    return JSON.stringify(this);
}

ThirdPartyUser.prototype.parse = function (ThirdPartyUserDetails) {
   
    this.name = ThirdPartyUserDetails.name;
    this.limit=ThirdPartyUserDetails.limit;
    this.apikey = uuidv1();
    
}
    
module.exports = {
    ThirdPartyUser
}