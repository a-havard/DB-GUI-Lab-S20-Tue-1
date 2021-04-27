import React, {useEffect, useState } from 'react';
import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { Popover } from '@material-ui/core'
import { useParams } from 'react-router';
import Post from './Post';

import { conn } from '../routes/config'
import Header from './NavBar.js'

const useStyles = makeStyles((theme) => ({
    profilepicgrid:{
      marginLeft: theme.spacing(4),
    },
    editButton:{
      backgroundColor:"brown",
      padddingTop: theme.spacing(1),
    },
    grid:{
      marginTop: theme.spacing(0),
      marginLeft: theme.spacing(1)
    },
    logo:{
      float: "center",
      marginLeft: theme.spacing(0),
    },
    picture:{
      width: "90%",
      paddingBottom: theme.spacing(2),
    },
    avatar: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.main,
    },
    formHeader: {
      fontWeight: 'bold'
    },
    submit: {
      margin: theme.spacing(3, 0, 2),
    },
    postPicture:{
      width: '100%',
    },
    profilePic:{
      borderRadius: '50%',
    },
    forms:{
      width:'300px',
      height:'400px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    formControl:{
      margin: "3px",
      border : "0",
      boxShadow:"0 4px 4px 4px lightgray",
      width:'85%'
    },
    formButton:{
      margin: '20px auto',
      borderWidth: 0,
      outline: 'none',
      borderRadius: '2px',
      backgroundColor: '#b3b3b3',
      color: '#ffffff',
      height: '50px',
      width: '100px'
    },
    bioLink:{
      width:'85%'
    },
    bioText:{
      width:'85%',
      height:'75%'
    },
    bioInfo:{
      width:'80%'
    },
    bio:{
      width:'80%',
      marginLeft:'10%',
      marginTop: '2%'
    },
    postsGrid:{
      width:'80%',
      marginLeft:'10%'
    },
    username:{
      height: 40,
      fontWeight: 'bold',
      fontSize: '2em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }))

 
 
var loaded=false;
const ProfilePage =()=>{
  console.log("test");
  const [anchorEl, setAnchorEl] = React.useState(null);
  //const [params,setParams]=React.useState(null);
var par=useParams();
  let fileInput = React.createRef(); 
  let temp;
  let [username,setUsername]=useState(null);
  let [bio,setBio]=useState('This account is private!');
  let [bioLink,setBioLink]=useState('');
  let [followers,setFollowers]=useState([]);
  let [following,setFollowing]=useState([]);
  let [profilePic,setProfilePic]=useState();
  const [pic, setPic] = useState('');
  let [openPPP,setPPP]=useState();
  let [posts,setPosts]=useState([]);
  let [popOpen,setPopOpen]=useState();
  let [addingPost,setPosting]=useState();
  let [selectedPost,setSelectedPost]=useState();
  const [showFollowerList,setSFL]=useState();
  const [showFollowingList,setSFLL]=useState();
  const [dataUri, setDataUri] = useState('');
  const [values, setValues] = useState([]);
 let [loaded,setLoaded]=useState();
 
useEffect(() => {

  console.log(par);
  var id=parseInt(par.id);
  var logged=''+localStorage.getItem('loggedInId');
  console.log(logged);
  if (!username) {
   
    conn.get("/accounts/"+par.id,{params:{loggedInId : logged}})
    .then((res) => {
        console.log(res.data);

        setUsername(''+res.data.data.username);
        if(res.data.data.bio)
          setBio(''+res.data.data.bio);
        if(res.data.data.bioLink)
          setBioLink(''+res.data.data.bioLink);
        if(res.data.data.followers)
        setFollowers(res.data.data.followers);
        if(res.data.data.following)
        setFollowing(res.data.data.following);
        if(res.data.data.profilePicture){
          setProfilePic(res.data.data.profilePicture);
          
        }
        
        loaded=true;
      })
      .catch((res) => {
      
      })
  conn.get("/posts/authors/"+par.id,{params:{loggedInId : localStorage.getItem('loggedInId')}})
    .then((res) => {
      //console.log(res.data.data);
      setPosts(res.data.data);
      
   
      //console.log(posts);
      var pics=[];
      let i=0;
    });
  }
});
 function openFollowers(){
   setSFL(true);
 }
 function openFollowing(){
  setSFLL(true);
}
function unfollow (id){
  console.log(id);
  conn.delete("followers/unfollow",{params:{
    leaderId:id,
    followerId: localStorage.loggedInId
  }}).then((res)=>{console.log(res)});
}
  function getPictures(){
    console.log(posts);
    let pics=[];
    let i=0;
  for( i=0;i<posts.length;i++){
    console.log(posts[i].photo);
    var arrayBufferView = new Uint8Array( posts[i].photo.data );
      var blob = new Blob( [arrayBufferView]);
  
      var imageUrl = URL.createObjectURL( blob );
      var reader = new FileReader();
      let y;
      reader.onload = function() {
         // alert(reader.result);
          y=reader.result;
          pics.push(y);
      }
      reader.readAsText(blob);
  }
  setValues(pics);
  //console.log(pics);
  }
  /*
  */
  const classes = useStyles();
    //let numPictures
  function FollowerList(){
    const handleClick = (event) => {
      //setAnchorEl(event.currentTarget);
      console.log("click");
      if(!showFollowerList)
        setSFL(true);
      
    };
  
    const handleClose = () => {
      setAnchorEl(null);
      setSFL(false);
    };
  
    const open = showFollowerList;
    const id = open ? 'simple-popover' : undefined;
    let pop=<div><Button aria-describedby={id} variant="contained" color="primary" onClick={handleClick}>
    Followers:{followers.length}
  </Button>
    <Popover
      id={id}
      open={showFollowerList}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        style: { width: '20%',
        height:'70vh'},
        }}
    >
        <ul className="list-group">
        {
            followers.map((x, i) => <div><a href={'/profile/'+x.userId}><button onClick={()=>{console.log(x)}}>{x.username }</button></a><br/></div>
         )
        }
     </ul>
    </Popover></div>;
    return (
      pop
    ); 
    
  }
  function FollowingList(){
    const handleClick = (event) => {
      console.log("click");
      if(!showFollowingList)
        setSFLL(true);
    };
  
    const handleClose = () => {
      setAnchorEl(null);
      setSFLL(false);
    };
  
    const open = showFollowingList;
    const id = open ? 'simple-popover' : undefined;
    let pop=<div><Button aria-describedby={id} variant="contained" color="primary" onClick={handleClick}>
    Following: {following.length}
  </Button>
    <Popover
      id={id}
      open={showFollowingList}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        style: { width: '20%',
        height:'70vh'},
        }}
    >
        <ul className="list-group">
        {
            following.map((x, i) => <Grid container><Grid item xs={5}><a href={'/profile/'+x.userId}><button onClick={()=>{}}>{x.userId }</button></a></Grid><Grid item xs={2}><button onClick={()=>unfollow(x.userId)}>Unfollow</button></Grid></Grid>
         )
        }
     </ul>
    </Popover></div>;
    return (
      pop
    ); 
    
  }
  function updateBio (newBio,newLink){
    let b=bio;
    if(newBio){
      setBio(newBio);
      b=newBio;
    }
    let L=bioLink;
    if(newLink){
      setBioLink(newLink);
    L=newLink}
    conn.put("/accounts/"+par.id+"/bio",{bio: b, bioLink:L})
    .then((res)=>{console.log(res)})
    .then(setPopOpen(false));
  }
  function BioForm(){
    
     let temp;
     let temp2;
    
    const handleClick = (event) => {
      if(!popOpen)
        setPopOpen(true);
      
    };
    function follow (id){
      conn.post("followers/follow",{
        leaderId:id,
        followerId: localStorage.loggedInId
      }).then((res)=>{console.log(res)});
    }
 
    const handleClose = () => {
      setAnchorEl(null);
      setPopOpen(false);
    };
  
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;
    let pop=<div><Button aria-describedby={id} variant="contained" color="primary" onClick={handleClick}>
    Edit Bio
  </Button>
    <Popover
      id={id}
      open={popOpen}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <form className={`${classes.forms}`}>
        <br/>
        <label for="link" className={`${classes.formHeader}`}>Link</label>
        <input
          type="text"
          name="link"
          id="link"
          className={classes.bioLink}
          
          onChange={ event => {temp2=( event.target.value )} } 
        />
        <label for="Bio" className={`${classes.formHeader}`}>Bio</label>
        <textarea
          name="Bio"
          id="Bio"
          className={classes.bioText}
          rows={10}
          onChange={ event => {temp=( event.target.value )} } 
        />
        <button
          type="button"
          className={classes.formButton}
          onClick={ () => updateBio(temp,temp2) }>
          ADD
        </button>            
      </form>
    </Popover></div>;
    if(par.id!=localStorage.getItem('loggedInId'))
      return <><button onClick={()=>follow(par.id)}>Follow Me</button></>;
    return (
      pop
    );
  }

  function addPost (formData){
    //console.log(file);
    let reader = new FileReader();
    let inFile = formData.file;
    if(!inFile){
      alert("No Photo");
      return;
    }
    //console.log(inFile);
    //console.log("add Post");
    reader.onloadend = () => {
      console.log(reader.result);
      let t= {authorId: par.id,
        instructions: formData.instructions,
        lookDifficulty: formData.lookDifficulty,
        lookKind: formData.lookKind,
        lookTime: formData.lookTime,
        photo: reader.result,
        products: formData.products,
       }
        
      
        conn.post('/posts/post',t)
          .then((res)=>{console.log(res)
            conn.get("/posts/authors/"+par.id,{params:{loggedInId : localStorage.getItem('loggedInId')}})
          .then((res) => {
             t=res.data.data;
            setPosts(t);
          });});
   };
  reader.readAsDataURL(inFile);
  }
  function PostInformationForm(){
    const handleClick = (event) => {
      if(!popOpen)
      setPosting(true);
    };
    const open = Boolean(anchorEl);
    const id = open ? 'simple-popover' : undefined;
    let pop=<div><Button aria-describedby={id} variant="contained" color="primary" onClick={handleClick}>
    Add New Post
  </Button>
    </div>;
     if(par.id!=localStorage.getItem('loggedInId'))
     return <></>;
    return (
      pop
    );
  }
  const handleClick = (event) => {
    //setAnchorEl(event.currentTarget);
    if(!popOpen)
    setPosting(true);
    
  };
    function PostingPopover(){
      /*let file='';
      let instructionlist='';
      let lookkind='';
      let difficulty=0;*/
      let formData= {
        instructions: "",
        lookDifficulty: 1,
        lookKind: "",
        lookTime: 0,
        file: '',
        products: "",
       };
    
      let ratings=[1,2,3,4,5,6,7,8,9,10];
    const handleClose = () => {
      setAnchorEl(null);
      setPosting(false);
    };
    if(par.id!=localStorage.getItem('loggedInId'))
    return <></>;
      return <Popover 
      className={classes.overlay}
      
      open={addingPost}
      anchorPosition={{left: '0vw',top: '0vh'}
      }
  
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      transformOrigin={{
        horizontal: 'center'
      }}
      
      PaperProps={{
      style: { width: '70%',
      height:'70vh'},
      }}
    >
     <h1>Please Enter the information for your new post</h1>
     <form className={classes.forms}>
     <Grid container  maxWidth="80vw" className={classes.grid} spacing={2}>
      <Grid item xs={12} >
        <label for='photo'>Select Photo:   </label><br/>
      <input
                        type="file"
                        name="photo"
                        id="photo"
                        className={classes.formControl}
                        ref={fileInput}
                        onChange={ event => {formData.file=( event.target.files[0])} } 
                    
                        />
                        </Grid>
      <Grid item xs={12} >
        <label for='instructions'>Please List Your Instructions:  </label><br/>
      <textarea
                        type="text"
                        name="Instructions"
                        id="instructions"
                        placeholder = "apply makeup to face"
                        
                        className={classes.formControl}
                        ref={fileInput}
                        onChange={ event => {formData.instructions=(event.target.value)} } 
                    
                        />
                        </Grid>
          <Grid item xs={5} >
        <label for='kind'>What type of look:  </label><br/>
      <input
                        type="text"
                        name="kind"
                        id="kind"
                        className={classes.formControl}
                        
                        ref={fileInput}
                        onChange={event => {formData.lookKind=( event.target.value)}} 
                    
                        />
                        </Grid>
          <Grid item xs={5} >
            <label for='products'>Time to do in minutes:  </label><br/>
              <input
                        type="number"
                        min={0}
                        name="products"
                        id="products"

                        className={classes.formControl}
                        ref={fileInput}
                        onChange={event => {formData.lookTime=( event.target.value)}} 
                    
                        />
                        </Grid>                        
        <Grid item xs={1} >
        <label for='difficulty'>Look Difficulty:  </label><br/>
            <select
                        type="select"
                        name="difficulty"
                        id="difficulty"
                        className={classes.formControl}
                        
                    
                        ref={fileInput}
                        onChange={ event => {formData.lookDifficulty=(event.target.value )} } 
                    
                        >
                         {
                                    ratings.map((x, i) => <option key={ i }>{ x }</option>)
                                }</select>
                        </Grid>
          
                        
      <Grid item xs={12} >
        <label for='products'>Products:  </label><br/>
        <textarea
                      
                        name="products"
                        id="products"
                        className={classes.formControl}
                        //onChange={handleImageChange}
                        placehoder = "enter the name and type of products here"
                        ref={fileInput}
                        onChange={event => {formData.products=( event.target.value)}} 
                        />
                        </Grid>
                        <Grid item xs={12} >
                        <button
                            type="button"
                            className={classes.formButton}
                            color = "blue"
                            onClick={ () => addPost(formData) }>
                            Post it
                        </button> 
                          </Grid>                 
      </Grid>
     </form>
    </Popover>
    }
    function ProfilePicPopover(){
      console.log("runs");
      let formData= {
        file: '',
       };
    
      let ratings=[1,2,3,4,5,6,7,8,9,10];
    const handleClose = () => {
      setAnchorEl(null);
      setPPP(false);
    };
    if(par.id!=localStorage.getItem('loggedInId'))
    return <></>;
      return <Popover 
      className={classes.overlay}
      
      open={openPPP}
      anchorPosition={{left: '0vw',top: '0vh'}
      }
  
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
      transformOrigin={{
        horizontal: 'center'
      }}
      
      PaperProps={{
      style: { width: '70%',
      height:'70vh'},
      }}
    >
     <h1>Please select the file for your new profile picture</h1>
     <form className={classes.forms}>
     <Grid container  maxWidth="80vw" className={classes.grid} spacing={2}>
      <Grid item xs={12} >
        <label for='photo'>Select Photo:   </label><br/>
      <input
                        type="file"
                        name="photo"
                        id="photo"
                        className={classes.formControl}
                        //onChange={handleImageChange}
                        ref={fileInput}
                        onChange={ event => {formData.file=( event.target.files[0])} } 
                    
                        />
                        </Grid>
                        <Grid item xs={12} >
                        <button
                            type="button"
                            className={classes.formButton}
                            color = "blue"
                            onClick={ () => {changeProfilePic(formData)} }>
                            Post it
                        </button> 
                          </Grid>                 
      </Grid>
     
   
                
     </form>
    </Popover>
    }
    function ShowImg(){
      console.log(profilePic);
      useEffect(()=>{
        if(!loaded){
          bufferToImage();
          loaded=true;
        }
        
      });
     
      if(profilePic=="https://via.placeholder.com/150"){
        setPic("https://via.placeholder.com/150");
      return <img src="https://via.placeholder.com/150" className={classes.profilePic} onClick={()=>{
        alert( "click");
        setPPP(true)}}></img>;}
        
        
        const bufferToImage= async ()=>{
          if(profilePic=="https://via.placeholder.com/150"||profilePic==''||!profilePic){
            setPic("https://via.placeholder.com/150");
            return;}
         
          console.log(profilePic);
          if(profilePic){
          var arrayBufferView = new Uint8Array( profilePic.data );
          var blob = new Blob( [arrayBufferView]);
        
         var imageUrl = URL.createObjectURL( blob );
         var reader = new FileReader();
         let y;
         reader.onload = function() {
            // alert(reader.result);
            console.log(reader.result);
             setPic(reader.result);
             
         }
         reader.readAsText(blob);
        }
      }
      console.log(pic);
     return <img src={pic} className={classes.postPicture} onClick={()=>{
      setPPP(true);}}/>;
      
    }

    /*function ShowImg(val){
      const [pic, setPic] = useState('');
     
        useEffect(()=>{
          if(!pic){
            bufferToImage();
          }
        },[]);
        const bufferToImage= async ()=>{
          var arrayBufferView = new Uint8Array( val.val.data );
          var blob = new Blob( [arrayBufferView]);
        
         var imageUrl = URL.createObjectURL( blob );
         var reader = new FileReader();
         let y;
         reader.onload = function() {
             setPic(reader.result);
         }
         reader.readAsText(blob);
        }
     return <img src={pic} className={classes.postPicture}/>;
      
    }*/
    function changeProfilePic(data){
      setPPP(false);
      let reader = new FileReader();
      let inFile = data.file;
      reader.onloadend = () => {
        console.log(reader.result);
        setPic(data.file);
        conn.put('/accounts/'+par.id+'/profilePicture',{profilePicture: reader.result})
          .then((res)=>{console.log(res)})
          .then(()=>{
            conn.get("/accounts/"+par.id,{params:{loggedInId : localStorage.loggedInId}}).then((res)=>{
              setProfilePic(res.data.data.profilePicture)}
            );
          });
      }
      reader.readAsDataURL(inFile);


          
    }
    function FormRow() {
      let items=[];
      
      
      return <Grid  item container xs={100} spacing={1} className={classes.postsGrid}>{
        posts.map((x,i)=> 
        <Grid item xs={4} key={ i }>
          <Post post={x}/>
          </Grid>)
    }</Grid>
    }
   const hc=(event)=>{
    setAnchorEl(event.currentTarget);
   }
    return(
      <>
      <Header />
      <PostingPopover/>
      <ProfilePicPopover/>
      <Card className={classes.bio} variant='outlined'>
        <CardContent className={classes.bioInfo}>
          <Grid container component="main" maxWidth="80vw" className={classes.grid} spacing={2}> 
            <Grid className={classes.profilepicgrid} item xs={2} rs={3} spacing={30}>
              <ShowImg></ShowImg>
            </Grid>
            <Grid id="info" item container xs spacing={1} justify='center' alignItems='flex-start'>
              <Grid item xs={6} >
                <Paper className={classes.username} variant='outlined'>{username}</Paper>
              </Grid>
              <Grid item xs alignItems='center'>
                <BioForm/>
              </Grid>
              <Grid item xs={6} rs={1}>
                <Paper elevation = {0} onClick={hc}><FollowerList/></Paper>
              </Grid>
              <Grid item xs={5} rs={1}>
                <Paper elevation = {0} onClick={hc}><FollowingList/></Paper>
              </Grid>
            </Grid>
            <Grid item xs rs={3}>
              <Card elevation = {0} >
                <CardContent>
                <p>{bio}</p>
                <a href={bioLink}>My Link: {bioLink}</a>
                </CardContent>
                </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Grid container component="main" maxWidth="80vw" className={classes.grid} spacing={2}> 
        <Grid item xs={12} rs={2}></Grid>
          <FormRow className={classes.postsGrid}/>
        <Grid item xs={12} rs={2}><PostInformationForm/></Grid>
      </Grid>
</>
    );
}

export default ProfilePage