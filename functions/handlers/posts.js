const admin = require('../util/admin').admin;
const db = require('../util/admin').db;

//const {admin} = require('../util/admin');
exports.getAllPosts =(req, res) => {

    db
      .collection('Posts')
      .orderBy('createdAt','desc')
      .get()
      .then((data) => {
         Posts = [];
         data.forEach((doc) => {
             Posts.push({
                 postId: doc.id,
                 body: doc.data().body,
                 userHandle: doc.data().userHandle,
                 createdAt: doc.data().createdAt,
                 name:doc.data().name,
                 userImage:doc.data().userImage,
                 likeCount:doc.data().likeCount,
                 commentCount:doc.data().commentCount

             });
         });
         return res.send(Posts); 
        });
 }

 exports.newPost = (req,res) =>{
    //res.send("dfsfds")
    const newPost = {
        body: req.body.body,
        userHandle: req.user.userHandle,
        name: req.user.name,
        createdAt: new Date().toISOString(),
        userImage:req.user.imageUrl,
        likeCount:0,
        commentCount:0
    };
    //res.send(newPost);

    admin.firestore()
    .collection('Posts')
    .add(newPost)
    .then((doc) => {
        const resPost =newPost;
        resPost.postId = doc.id;
        res.json({message: resPost});   
    }).catch((err) =>{
        res.status(500).json({error: "error"});
    })
}

exports.getPostAndComments =(req,res) =>{
    let postData ={};
    console.log(req.params);
    db.doc(`/Posts/${req.params.postId}`).get()
    .then(doc =>{
        if(!doc.exists){
            return res.status(404).json({error:'post not found'});

        }
        postData =doc.data();
        postData.postId =doc.id;
        return db.collection("Comments").where("postId", "==", req.params.postId).get();
    })
    .then(data =>{
         postData.comments = [];
         console.log(data);
         data.forEach(doc => {
             postData.comments.push(doc.data());
         });
         return res.json(postData);
    })
    .catch(err =>{
        console.error(err);
        res.status(500).json({error: err.code});
    })
}


exports.commentOnPost =(req,res)=>{
    console.log("request body:",req.body);
    console.log("request params:",req.params);

    if(req.body.body.trim() === '') return res.status(400).jso({error: "must not be empty"});

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        postId: req.params.postId,
        userHandle: req.user.userHandle,
        image:req.user.imageUrl,
        likeCount: 0
      
    }

    db.doc(`/Posts/${req.params.postId}`).get()
    .then(doc =>{
    
        console.log(newComment);
        if(!doc.exists){
            return res.status(404).json({error: "Post no longer exists"});
        }
        return db.collection('Comments').add(newComment);
        
    })
    .then(() =>{
        res.json({newComment});
    })
    .catch( err =>{
        console.log(err);
        return res.status(500).json({error:"something went wrong"});
    })

}

//like a posts
exports.likePost =(req,res)=>{
    console.log(req.user);
    const likeDocument =db.collection('Likes').where('userId', '==', req.user.user_id)
    .where('postId', '==', req.params.postId).limit(1);
    const postDocument = db.doc(`/Posts/${req.params.postId}`);

    let postData = {};

    postDocument.get()
    .then(doc =>{
        console.log(doc.id);
        console.log(doc);
        if(!doc.exists){
            return res.status(404).json({error:'post not found'});
        } else{
            
            postData = doc.data();
            postData.postId =doc.id;

            return likeDocument.get();
        }
    })
    .then(data =>{
        if(data.empty){
            return db.collection('Likes').add({
                postId: req.params.postId,
                userHandle: req.user.userHandle,
                createdAt:new Date().toISOString()
            })
            .then(() =>{
                postData.likeCount++;
                return postDocument.update({likeCount:postData.likeCount});
            })
            .then(() => {
                return res.json(postData);
            })
        } else{
            return res.status(400).json({error:'post already liked'});
        }
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({error:err.code});
    })
}

//TO DO : when i unlike a post remove that like from the likes database
exports.unLikePost =(req,res)=>{
    console.log(req.user);
    const likeDocument =db.collection('Likes').where('userId', '==', req.user.user_id)
    .where('postId', '==', req.params.postId).limit(1);
    const postDocument = db.doc(`/Posts/${req.params.postId}`);

    let postData = {};

    postDocument.get()
    .then(doc =>{
        console.log(doc.id);
        console.log(doc);
        if(!doc.exists){
            return res.status(404).json({error:'post not found'});
        } else{
            
            postData = doc.data();
            postData.postId =doc.id;

            return likeDocument.get();
        }
    })
    .then(data =>{
        if(data.empty){
            return db.collection('Likes').add({
                postId: req.params.postId,
                userHandle: req.user.userHandle,
                createdAt:new Date().toISOString()
            })
            .then(() =>{
                postData.likeCount--;
                return postDocument.update({likeCount:postData.likeCount});
            })
            .then(() => {
                return res.json(postData);
            })
        } else{
            return res.status(400).json({error:'post already liked'});
        }
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({error:err.code});
    })
}


