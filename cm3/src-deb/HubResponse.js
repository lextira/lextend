function HubResponse()
{
    this.status = 'ok';
    this.errorCode = 0;
    this.message = 'na';
    this.data     = null;

    this.getOkResponse = function()
    {
      this.status = 'ok';
      this.errorCode = 0;
      this.message = null;

      return this.toJsonString();
    }
    this.getErrorResponse = function(errorCode,errMsg)
    {
      this.status = 'error';
      this.errorCode = errorCode;
      this.message =  errMsg;
      this.data = null;

      return this.toJsonString();
    }

    this.toJsonString = function(){

        return JSON.stringify(this);

    }

}


// export the class
module.exports =
 {
    HubResponse
 };
