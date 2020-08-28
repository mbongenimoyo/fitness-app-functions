const {db,admin} = require('../util/admin');
const config = require('../util/config');


const isEmail = require('../util/validators').isEmail;
const isEmpty = require('../util/validators').isEmpty;
const reduceUserDetails = require('../util/validators').reduceUserDetails;

firebase = require('firebase');
firebase.initializeApp(config);



exports.signup = (req,res) =>{
    console.log(req.body);
    const newUser ={
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        confirmPassword: req.body.confirmPassword,
        userHandle: req.body.userHandle,
    };

    errors ={};
    if(isEmpty(newUser.email)){
        errors.email= "Must not be empty";
    }
    else if(!isEmail(newUser.email)){
        errors.email ="Invalid Email";
    }

    if(isEmpty(newUser.password)) errors.password ="Invalid password";
    if(newUser.password!== newUser.confirmPassword) errors.confirmPassword ="Passwords do not match";
    if(isEmpty(newUser.userHandle)) errors.handle ="Must not be empty";

    if(Object.keys(errors).length>0) return res.status(400).json(errors);
  
    const noImage = 'no-profile-pic.png';
    //TODO: validate data
    db.doc(`/Users/${newUser.userHandle}`).get()
    .then((doc) =>{
        if(doc.exists){
            return res.status(400).json({ userHandle: "this handle already exists"});
        } else{
            return  firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email,newUser.password);
        };
    })
    .then((data) => {
        userId = data.user.uid;
        //res.json(userId);
        //console.log("user data"+data.user);
        return data.user.getIdToken();
    })
    .then((tokenId) =>{
        token=tokenId;
        //res.json();
        
        const userCredentials = {
            userHandle: newUser.userHandle,
            email: newUser.email,
            name:newUser.name,
            createAt: new Date().toISOString(),
            imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImage}?alt=media`,
            userId
        };
        console.log(userCredentials)
        db.doc(`/Users/${userCredentials.userId}`).set(userCredentials);    
       //res.json(userCredentials);
    })
    .then(()=>{
        
         res.status(201).json({token});
    })
    .catch( (err) =>{
        console.error(err);
        if(err.code =="auth/email-already-in-use"){
            return res.status(400).json({email: "Email already in use"});
        }else{
            return res.status(500).json({error:"dsf"});
        }
    }); 
}

exports.login =(req,res) =>{
    user ={
        email:req.body.email,
        password:req.body.password
    };

    errors ={};

    if(isEmpty(user.email)) errors.email = "Must not be empty";
    if(isEmpty(user.password)) errors.password="Must not be empty";

    if(Object.keys(errors).length >0) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email,user.password)
    .then(data =>{
        return data.user.getIdToken();
    })
    .then(token =>{
        return res.json({token});
    })
    .catch(err =>{
        //console.error(err);
        if(err.code==="auth/user-not-found" || err.code==="auth/wrong-password"){
            return res.status(400).json({error:"Invalid credentials"});
        }
        return res.status(500).json({error: err.code});
    })
}
exports.getAuthicatedUser = (req,res) =>{

    let userData = {};
    console.log(req.user);
    db.doc(`/Users/${req.user.uid}`).get()
    .then(doc =>{
        if(doc.exists){
            userData.userCredentials = doc.data();
            
            return db.collection('Likes').where('userId' ,"==" ,req.user.uid ).get();
        }
    })
    .then(data => {
        userData.likes =[];
        data.forEach(doc =>{
            userData.likes.push(doc.data());
        });
        return res.json(userData);
    })
    .catch(err =>{
        console.error(err);
        return res.status(500).json({err:error.code})
    })
}


// Add user details 
exports.addUserDetails =(req,res)=>{
    let userDetails = reduceUserDetails(req.body);
    console.log(req.user);
    db.doc(`/Users/${req.user.uid}`).update(userDetails)
    .then(()=>{
        return res.json({message: 'Details added successfully'});
    })
    .catch(err =>{
        console.error(err);
        return res.status(500).json({error:err.code});
    })

}


//Upload user profile picture
exports.uploadImage=( req,res)=>{

    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const data = req.user;
    //res.send(req.user);
    temp = req.user;
    const busboy = new BusBoy({headers:req.headers});
 
    let imageFilename;
    imageToBeUploaded ={};
    busboy.on('file',(fieldname,file,filename,encoding,mimetype) =>{

        if(mimetype!= "image/jpg" || mimetype!= "image/png"){
                return res.status(400).json({error: 'Wrong file type submitted'});
        }
        console.log(filename,fieldname,mimetype);
        
       
        //image.png
        const imageExtension = filename.split('.')[filename.split('.').length-1];
        imageFilename =`${Math.round(
            Math.random() * 10000000000000)
        }.${imageExtension}`;

        const filePath = path.join(os.tmpdir(),imageFilename)
        console.log(os.tmpdir());
        imageToBeUploaded = {filePath, mimetype};
        
        file.pipe(fs.createWriteStream(filePath));

       //res.send("we are here");
        
        
    });


    busboy.on('finish', () =>{
        
        admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata:{
                metadata:{
                    contentType : imageToBeUploaded.mimetype
                }
            }
        })
        .then(()=>{
            const imageUrl =`https://firebasestorage.googleapis.com/v0/b/${
                config.storageBucket
            }/o/${imageFilename}?alt=media`;
            
            console.log("filename:"+imageFilename);
            return db.doc(`/Users/${temp.uid}`).update({imageUrl});
             

        })
        .then(()=>{
           return  res.json({message:"image uploaded successfully", re:req.user.userId});
        })
        .catch(err =>{
            console.error(err);
            res.json({error:err.code});
        })
    })
 console.log("before");
    busboy.end(req.rawBody);
   

}