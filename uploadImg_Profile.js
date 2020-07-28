var user = function (name,file) {
    this._name = name;
    this._file=file;
    
};


exports.uploadImg_Profile= function(req, res){
    var User = new user({ 
        name : req.body.name,
        file : req.file
    });

    //console.log(req);

    console.log(User.file)
    console.log( User.name);
   

}