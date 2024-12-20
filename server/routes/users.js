var express = require('express');
var router = express.Router();
require('dotenv').config();

const User = require('../models/User');
const Post = require('../models/Post');

const { Pool } = require('pg');

const client = new Pool({ connectionString: process.env.POSTGRE_DB_URL });

router.get('/data/pg', async (req, res) => {

  try {
    const [users, posts] = await Promise.all([
      client.query('SELECT * FROM Users'),
      client.query('SELECT * FROM Posts'),
    ]); 

    let data = [];
    // pushing datasets to an array
    data.push(users.rows, posts.rows) 

    const response = [
      { title: "Users", data: users.rows },
      { title: "Posts", data: posts.rows }
    ];

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});


router.get('/data/mongo', async (req, res) => {
  try {
    const posts = await Post.find();
    const users = await User.find();

    const response = [
      { title: "Users", data: users },
      { title: "Posts", data: posts }
    ];

    res.json(response);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

router.get('/data/joined', async (req, res) => {
  console.log("is it working")
  try {
    const mongoPosts = await Post.find();
    const mongoUsers = await User.find();

    const [pgUsers, pgPosts] = await Promise.all([
      client.query('SELECT * FROM Users'),
      client.query('SELECT * FROM Posts'),
    ]); 
    
    // create joined data from both databases for user and post data
    const joinedUsers = [
      ...pgUsers.rows.map(user => ({
        id: user.userid,
        name: user.username,
        email: user.email,
        gender: user.gender,
        source: 'SQL'
      })),
      ...mongoUsers.map(user => ({
        id: user._id.toString(), 
        name: user.username,
        email: user.email,
        gender: user.gender,
        source: 'NoSQL'
      }))
    ];

    const joinedPosts = [
      ...pgPosts.rows.map(post => ({
        id: post.postid,
        user: post.userid,
        content: post.content,
        source: 'SQL'
      })),
      ...mongoPosts.map(post => ({
        id: post._id.toString(), 
        user: post.userid.toString(),
        content: post.content,
        source: 'NoSQL'
      }))
    ];

    const response = [
      {title: "Users", data: joinedUsers},
      {title: "Posts", data: joinedPosts}
    ];

    res.json(response);
} catch (err) {
    res.status(500).json({ error: err.message });
}
});


router.get('/data/:username', async (req, res) => {
  const username = req.params.username;
  console.log(username)

  try {
    let posts;
    let user; 
    
    user = await User.findOne({ username });

    if (user) { // if user is found from Mongo, fetch their posts
      posts = await Post.find({ userid: user._id});
    } else {
      const sqlUserQuery = 'SELECT * FROM Users WHERE username = $1';
      const sqlPostsQuery = 'SELECT * FROM Posts WHERE userid = $1';

      const sqlRes = await client.query(sqlUserQuery, [username]);
      if (sqlRes.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      user = sqlRes.rows[0];
      const sqlPosts = await client.query(sqlPostsQuery, [user.userid]);
      posts = sqlPosts.rows
    }

    const response = [
      { title: "User", data: [user] },
      { title: "Posts", data: posts }
    ];

    
    console.log(response)

    res.json(response);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
});


router.post('/edit', async (req, res) => {
  let username = req.body.username;
  let edited_username = req.body.new_username;
  let edited_gender = req.body.gender;
  let user;

  if (edited_username == null && edited_gender == null) { // return if no changes are sent from client
    return res.status(406).json({ error: "No chanegs provided" });
  } else if (edited_username == null) { // using the old username if new username was not provided
    edited_username = username;
  }

  try {
    user = await User.findOne({ username });

    if (user) { // if user is found from Mongo, edit their info
      console.log(user)
      console.log(user._id)

      if (edited_gender == null) {
        updateRes = await User.updateOne({ _id: user._id }, 
          { $set: { 
            username: edited_username
          }}
        )
      } else {
        updateRes = await User.updateOne({ _id: user._id }, 
          { $set: { 
            username: edited_username,
            gender: edited_gender
          }}
        )
      };
      
    } else {
      const sqlUsernameQuery = 'UPDATE Users SET username = $1 WHERE username = $2';
      const sqlUserGenderQuery = 'UPDATE Users SET gender = $1 WHERE username = $2';

      if (edited_gender != null) {
        const sqlGenderRes = await client.query(sqlUserGenderQuery, [edited_gender, username]);
        if (sqlGenderRes.rowCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }
      }

      const sqlUserRes = await client.query(sqlUsernameQuery, [edited_username, username]);
      if (sqlUserRes.rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    return res.status(200).json({ message: "User updated successfully" });

  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: err.message });
  }
});


router.post('/delete', async (req, res) => {
  let username = req.body.username;
  let postid = req.body.postid;
  let user;

  try {
    user = await User.findOne({ username });

    if (user) { // if user is found from Mongo, delete their post

      deleteRes = await Post.deleteOne( {_id: postid} );
      console.log(deleteRes);
      
    } else {
      const sqlDeleteQuery = 'DELETE FROM Posts WHERE postid = $1';

      const sqlDeleteRes = await client.query(sqlDeleteQuery, [postid]);
      if (sqlDeleteRes.rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
    }

    return res.status(200).json({ message: "Post deleted successfully" });

  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: err.message });
  }
});


router.post('/insert', async (req, res) => {
  let username = req.body.username;
  let postContent = req.body.content;
  let user;

  try {
    user = await User.findOne({ username });

    if (user) { // if user is found from Mongo, add new post

      insertRes = await Post.create( {
        userid: user._id,
        content: postContent
      } );
      console.log(insertRes);
      
    } else {
      const sqlInsertQuery = 'INSERT INTO Posts (userid, content) VALUES ($1, $2)';
      const sqlUseridQuery = 'SELECT userid FROM Users WHERE username = $1';

      const sqlUseridRes = await client.query(sqlUseridQuery, [username]);
      if (sqlUseridRes.rowCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      let userid = sqlUseridRes.rows[0].userid;

      const sqlInsertRes = await client.query(sqlInsertQuery, [userid, postContent]);
      if (sqlInsertRes.rowCount === 0) {
        return res.status(404).json({ error: "Error in adding post" });
      }
    }

    return res.status(200).json({ message: "Post added successfully" });

  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;
