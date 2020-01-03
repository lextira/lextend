function User() {

    this.name = null;
    this.email = null;
    this.contact = null;
    this.role = null;
    this.userName = null;
    this.password = null;

    this.toJson = function () {
        return JSON.stringify(this)
    }


}

User.prototype.toJson = function () {
    return JSON.stringify(this);
}

User.prototype.parse = function (userDetails) {
   
    this.name = userDetails.name;
    this.email = userDetails.email;
    this.contact = userDetails.contact;
    this.role = userDetails.role;
    this.userName = userDetails.userName;
    this.password = userDetails.password;


}



module.exports = {
    User
}