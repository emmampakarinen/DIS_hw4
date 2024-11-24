import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import DataTable from './components/DataTable'; 
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';


function App() {
  const [datasets, setData] = useState(null);
  const [username, setUsername] = useState(null);
  const [userFound, setUserFound] = useState(false);
  const [editUsername, setEditUsername] = useState(null);
  const [gender, setGender] = useState(null);
  const [postid, setPostid] = useState(null);

  const handleChange = (event) => {
    setGender(event.target.value);
  };

  const fetchData = async (location) => {
    try {
      const response = await fetch(`users/data/${location}`);
      const result = await response.json();
      console.log("result", result)

      if (result.error || result == null) {
        console.log(result.error)
        throw new Error(result.error);
      }
      
      if (location == username) {
        setUserFound(true);
      } else {
        setUserFound(false);
      }

      setData(result);
      
    } catch (err) {
      setData(null)
      setUserFound(false);
      console.log("error occurred:", err.message);
    }
    
  };


  const sendData = async (editUsername, gender) => {
    try {
      fetch("users/edit", {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({
          "username": username,
          "new_username": editUsername,
          "gender": gender
        }),
        mode: "cors"
      }).then(async response => {
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Unknown error");
        }

        return response.json()
      }).then(data => {
        console.log(data)
      })
      
    } catch (err) {
      console.log("error occurred:", err.message);
    }
    
  };


  const deletePost = async (postid) => {
    if (postid === null) {
      return;
    }

    try {
      fetch("users/delete", {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({
          "username": username,
          "postid": postid
        }),
        mode: "cors"
      }).then(async response => {
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Unknown error");
        }

        return response.json()
      }).then(data => {
        console.log(data)
      })
      
    } catch (err) {
      console.log("error occurred:", err.message);
    }
    
  };


  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent={"center"}>
      <h1>Select database to fetch data from</h1>
      <Stack spacing={2} direction="row" padding={3}>
        <Button sx={{ backgroundColor:"#05668d" }} variant="contained" onClick={() => fetchData("pg")}>PostgreSQL</Button>
        <Button sx={{ backgroundColor:"#05668d" }} variant="contained" onClick={() => fetchData("mongo")}>MongoDB</Button>
        <Button sx={{ backgroundColor:"#05668d" }} variant="contained" onClick={() => fetchData("joined")}>Joined</Button>
      </Stack>

      <h2>Search user's posts
      </h2>
      <Stack spacing={2} direction="row" padding={3}>
        <TextField 
          color="05668d" 
          label="username" 
          variant="outlined" 
          focused 
          onChange={(e) => {setUsername(e.target.value)}}
        />
        <Button sx={{ backgroundColor:"#05668d" }} variant="contained" onClick={() => fetchData(username)}>Fetch</Button>
      </Stack>

      {userFound ? 
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent={"center"}>
          <Box display="flex" flexDirection="row" alignItems="center" justifyContent={"center"}>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent={"center"}>
              <h3>Edit user info</h3>
              <Stack spacing={2} direction="row" padding={3}>
                <TextField 
                  color="05668d" 
                  label="Edit username" 
                  variant="outlined" 
                  defaultValue={username} 
                  focused onChange={(e) => {setEditUsername(e.target.value)}}
                />
                <FormControl fullWidth>
                  <InputLabel id="select-gender">Edit gender</InputLabel>
                  <Select
                    value={gender}
                    label="Gender"
                    onChange={handleChange}
                  >
                    <MenuItem value={"Male"}>Male</MenuItem>
                    <MenuItem value={"Female"}>Female</MenuItem>
                    <MenuItem value={"Not disclosed"}>Not disclosed</MenuItem>
                  </Select>
                </FormControl>

                <Button sx={{ backgroundColor:"#05668d" }} variant="contained" onClick={() => sendData(editUsername, gender)}>Submit changes</Button>
              </Stack>
            </Box> 
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent={"center"}>
              <h3>Delete post by post ID</h3>
              <Stack spacing={2} direction="row" padding={3}>
                  <TextField
                  label="Post ID"
                  type="text"
                  onChange={(e) => {setPostid(e.target.value)}}
                />
                <Button sx={{ backgroundColor:"#05668d" }} variant="contained" onClick={() => deletePost(postid)}>Delete post</Button>
              </Stack>
            </Box> 

          </Box> 
        </Box> 
        
      : null}

      {datasets ? <Box display="flex" flexWrap="wrap" justifyContent="center" gap={4}>
      {datasets.map((dataset, index) => (
        <Box alignItems="center" justifyContent={"center"} key={index} padding={1}>
          <h3>
            {dataset.title}
          </h3>
          <DataTable data={dataset.data} />
          </Box>
        ))}
      </Box> : "No data to show"}
    </Box>
  );
}

export default App;
