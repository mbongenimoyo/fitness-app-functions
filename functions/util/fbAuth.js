const {admin,db} = require('./admin');

module.exports =(req,res,next) =>{
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
        
    } else{
        console.error('No token found');
        return res.status(403).json({err: "Unauthorized"});
    }

    //TO DO: find and correlating user handle 
    admin.auth().verifyIdToken(idToken)
    .then((decodedToken) =>{
        req.user =decodedToken;
        console.log(decodedToken)
        return db.collection('Users')
         .where('userId', '==', req.user.uid)
        .get();
        
    })
    
    
    .then((data) =>{
       

        data.forEach((doc) =>{
            d=doc.data();
        })
       
       
        req.user.userHandle = d.userHandle;
        req.user.name =d.name;
        req.user.imageUrl =data.docs[0].data().imageUrl;
        //res.json({"r":"sdfes"});
        return next();
    })
    .catch(err =>{
        console.error('Error while verifying',err);
        return res.status(403).json({err:"verification error"});
    })
}
