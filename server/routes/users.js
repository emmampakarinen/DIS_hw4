var express = require('express');
var router = express.Router();
require('dotenv').config();

const User = require('../models/User');
const Post = require('../models/Post');

const { Pool } = require('pg');

const client = new Pool({ connectionString: process.env.POSTGRE_DB_URL });


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


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
    //console.log(response)
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
      console.log(user)
      console.log(user._id)
      posts = await Post.find({ userid: user._id});
    } else {
      const sqlUserQuery = 'SELECT * FROM Users WHERE username = $1';
      const sqlPostsQuery = 'SELECT * FROM Posts WHERE userid = $1';

      const sqlRes = await client.query(sqlUserQuery, [username]);
      if (sqlRes.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(user)
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
  console.log(req.body)
  let username = req.body.username;
  let edited_username = req.body.new_username;
  let edited_gender = req.body.gender;
  let user;

  try {

    if (edited_username == null && edited_gender == null) {
      return res.status(406).json({ error: "No chanegs provided" });
    } else if (edited_username == null) { // return if no changes are sent from client
      edited_username = username;
    }

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


module.exports = router;
