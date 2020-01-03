var ThirdPartyUserModule =require('./ThirdPartyUser.js')



function ThirdPartyUserFactory(){

    this.createThirdPartyUserInstance = function(){
        var result = new ThirdPartyUserModule.ThirdPartyUser();
        return result;
    }

}

module.exports = {
    ThirdPartyUserFactory
}