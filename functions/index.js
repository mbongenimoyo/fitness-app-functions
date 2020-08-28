const functions = require('firebase-functions');



const express = require('express');
const app =express();

const {db} =require('./util/admin');
const {getAllPosts,newPost} = require('./handlers/posts');

const signup = require('./handlers/users').signup;

const login =require('./handlers/users').login;

const uploadImage =require('./handlers/users').uploadImage;
const addUserDetails =require('./handlers/users').addUserDetails;

const getAuthicatedUser =require('./handlers/users').getAuthicatedUser;
const getPostAndComments = require('./handlers/posts').getPostAndComments;
const commentOnPost = require('./handlers/posts').commentOnPost;
const likePost = require('./handlers/posts').likePost;
const unLikePost = require('./handlers/posts').unLikePost;
//TODO delete post
const FBAuth = require('./util/fbAuth');




//const firebase =require('firebase');

//firebase.initializeApp();



exports.api = functions.https.onRequest(app);

//Post routes
app.get('/posts',getAllPosts);
app.post('/newpost', FBAuth, newPost);
app.get('/post/:postId',getPostAndComments);
app.post('/post/:postId/comment', FBAuth, commentOnPost);
app.post('/post/:postId/like',FBAuth,likePost);
app.post('/post/:postId/unlike',FBAuth,unLikePost);
// app.post('/post/:postId/share',sharePost);
// app.post('/post/:postId/fave',favePost);
// display timeline
// get followers
//get following


/////SEARCH ROUTES/////////
/* get search results*/


//Users route
app.post('/signup', signup);
app.post('/login',login);
app.post('/user/image',FBAuth, uploadImage);
app.post('/user', FBAuth ,addUserDetails);
app.get('/user', FBAuth ,getAuthicatedUser);


//GROUP ROUTES
/* routes to display groups*/

//COURSE ROUTES
//





exports.createNotificationsOnLike = functions.firestore.document('Likes/{id}')
.onCreate((snapshot) =>{
    console.log("snapshot:"+snapshot.id, "userId:"+snapshot.data().userHandle);
    db.doc(`/Posts/${snapshot.data().postId}`).get()
    .then(doc =>{
        console.log("doc:"+doc.data())
        if(doc.exists){
            return db.doc(`/Notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient:doc.data().userHandle,
                sender:snapshot.data().userHandle,
                type: 'like',
                read:false,
                postId: doc.id
            })
        }
    })
    .then(() =>{
        return ;
    })
    .catch(err =>{
        console.error(err);
        return ;
    })
})

exports.createNotificationsOnComment = functions.firestore.document('Comments/{id}')
.onCreate((snapshot) =>{
    console.log("snapshot:"+snapshot.id, "userId:"+snapshot.data().userHandle);
    db.doc(`/Posts/${snapshot.data().postId}`).get()
    .then(doc =>{
        console.log("doc:"+doc.data())
        if(doc.exists){
            return db.doc(`/Notifications/${snapshot.id}`).set({
                createdAt: new Date().toISOString(),
                recipient:doc.data().userHandle,
                sender:snapshot.data().userHandle,
                type: 'like',
                read:false,
                postId: doc.id
            })
        }
    })
    .then(() =>{
        return ;
    })
    .catch(err =>{
        console.error(err);
        return ;
    })
  
})

//TO DO : delete notifcations when unliked
//TO DO : mark notifcations as read
//
















