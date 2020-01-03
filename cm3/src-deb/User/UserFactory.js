var UserModule =require('./User.js')



function UserFactory(){

    this.createUserInstance = function(){
        var result = new UserModule.User();
        return result;
    }

}

module.exports = {
    UserFactory
}