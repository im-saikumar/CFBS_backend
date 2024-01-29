import express from "express";
import { AWS_ACCESS_KEY_ID, AWS_S3_BUCKET_NAME, AWS_SECRET_ACCESS_KEY, CLIENT_ID, CLIENT_SECRET, PORT, S3_REGION } from "./config.js";
import mongoose from "mongoose";
import { mongoDBURL } from "./config.js";
import { Post } from "./post.js";
import { State } from "./states.js";
import {Notifications} from "./notifications.js"
import multer from "multer";
import AWS from "aws-sdk";
import cors from 'cors';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { ObjectId } from "mongodb";
import { ContactUs } from "./contact.js";


const app = express();
app.use(express.json());
app.use(cors())

const options = {
  // weekday: 'long',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

app.get("/", (req, res) => {
  console.log(req);
  return res.status(200).send("welcome");
});

////////////////////// Upload image api /////////////////////////

// app.get('/', (req, res) => {
//   res.send(`
//     <h2>File Upload With <code>"Node.js"</code></h2>
//     <form action="/upload" enctype="multipart/form-data" method="post">
//       <div>Select a file: 
//         <input type="file" name="image" multiple="multiple" />
//       </div>
//       <input type="submit" value="Upload" />
//     </form>

//   `);
// });

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: S3_REGION
});

const s3 = new AWS.S3();

const storage = multer.memoryStorage(); // Store file as Buffer in memory
const upload = multer({ storage: storage });

app.post('/upload_post', upload.single('image'), async (req, res) => {
  try {

    if (!req.body.title || !req.body.description) {
      return res.status(400).send({
        message: "send title & description",
      });
    }
    // const headingText = req.body.headingText;
    const { originalname, buffer, mimetype } = req.file;  
      const params = {
          Bucket: AWS_S3_BUCKET_NAME,
          Key: originalname,
          Body: buffer,
          ContentType: mimetype
      };

      await s3.upload(params).promise();
      // res.status(201).json({ message: 'Image uploaded successfully!', url: `https://${AWS_S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${params.Key}`, text: headingText  });
      const newPost = {
        title: req.body.title,
        sub_heading: req.body.sub_heading,
        description: req.body.description,
        visiblity: req.body.visiblity,
        name: req.body.name,
        state: req.body.state,
        district: req.body.district,
        email: req.body.email,
        imagepath : `https://${AWS_S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${params.Key}`, 
        comment: [],
        liked: [],
        saved: [],
        requests :[],
        report:[]
      };
      const result = await Post.create(newPost);
      return res.status(200).json({message: "Successfully uploaded"});
  } catch (error) {
      console.error(error.stack);
      res.status(500).json({ error: error.message });
  }
});

app.post('/upload_request', upload.single('image'), async (req, res) => {

  const {name, id, email, description} = req.body

  try {
    if (!description || !id) {
      return res.status(400).send({
        message: "send id & description",
      });
    }
    // const headingText = req.body.headingText;
    const { originalname, buffer, mimetype } = req.file;  
      const params = {
          Bucket: AWS_S3_BUCKET_NAME,
          Key: originalname,
          Body: buffer,
          ContentType: mimetype
      };

      await s3.upload(params).promise();
      await Post.updateOne(
        { _id: id },
        {
          $push: {
            requests: {
              id: new ObjectId(),
              name: name,
              date: new Date(),
              description: description,
              email: email,
              imagepath : `https://${AWS_S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${params.Key}`, 
            },
          },
        }
      );
      return res.status(200).json({message: "Successfully uploaded"});
  } catch (error) {
      console.error(error.stack);
      res.status(500).json({ error: error.message });
  }
});

///////////////// end /////////////////

//////////////////////////////// connection /////////////////////////////////

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log("DB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));

///////////////// end /////////////////

//////////////// get posts /////////////////////////////

app.get("/post", async (req, res) => {
  const {status} = req.query
  try {
    const getPost = await Post.find({status : status}).sort( { _id:-1 } );
    return res
      .status(200)
      .json(
        getPost.map((data) => ({
          id: data.id,
          createdAt: data.createdAt.toLocaleDateString('en-IN', options),
          heading: data.title,
          state : data.state,
          district: data.district,
          description: data.description,
          name: data.visiblity ? data.name : "Anonymous",
          imagepath: data.imagepath,
          likes: data.liked?.length,
          comments: data.comment?.length,
          you_liked: data.liked?.includes(data.email),
          you_saved: data.saved?.includes(data.email),
          views: data.ip_address?.length,
          saves: data.saved?.length
        }))
      );
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});


//////////////// get single post in details /////////////////////////////


app.post("/post_details", async (req, res) => {

  const {id, email, ip} = req.body

  if (!id || !ip) {
    return res.status(400).send({
      message: "please send id, email, ip",
    });
  }

  try {

    const getPost = await Post.findOne({ _id: id }); 
    (!getPost.ip_address.includes(ip)) && await Post.updateOne({ _id: id },{ $push: { ip_address: ip }})
    return res.status(200).json({
          id: getPost.id,
          createdAt: getPost.createdAt.toLocaleDateString('en-IN', options),
          heading: getPost.title,
          subheading: getPost.sub_heading,
          description: getPost.description,
          state: getPost.state,
          district : getPost.district,
          status : getPost.status,
          name: getPost.visiblity ? getPost.name : "Anonymous",
          email : (email === getPost.email ? getPost.email : "***********"), 
          imagepath: getPost.imagepath,
          likes: getPost['liked']?.length,
          comments: getPost['comment']?.length,
          you_liked: getPost['liked']?.includes(getPost.email),
          you_saved: getPost['saved']?.includes(getPost.email),
          views: getPost['ip_address']?.length,
          saves: getPost['saved']?.length,
          requests : getPost['requests'].map(data => 
            ({
              id: data.id,
              email : (getPost.visiblity || data.email !== getPost.email) ? data.email : "***********",
              name: (getPost.visiblity || data.email !== getPost.email) ? data.name : "Post Author (Anonymous)",
              imagepath: data.imagepath,
              date: data.date.toLocaleDateString('en-IN', options),
              description: data.description,
            })),
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
});

//////////////// edit post details /////////////////////////////

app.post("/edit_post", async (req, res) => {
  const {id, email, heading, subheading, description} = req.body
  if (!id || !heading || !description ){
    return res.status(400).send({
      message: "please send id, heading & description",
    });
  }
  try {
    const editPost = await Post.updateOne({ email : email, _id: id },
      { $set : 
        { 
          title : heading,
          sub_heading: subheading,
          description : description,
        }});
    return res.status(200).json({message: "successfully updated"});
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
})

//////////////// comments /////////////////////////////

app.post("/add_comment", async (req, res) => {

  const {id, comment, name, email} = req.body

  if (!id || !comment || !name) {
    return res.status(400).send({
      message: "please send id, comment & name",
    });
  }
  try {
    await Post.updateOne(
      { _id: id },
      {
        $push: {
          comment: {
            id: new ObjectId(),
            name: name,
            email: email,
            date: new Date(),
            comment: comment,
          },
        },
      }
    );
    return res.status(200).json({message: "success"});
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.get("/get_comments", async (req, res) => {
  const add_comment = {
    id: req.query.id,
  };

  if (!req.query.id) {
    return res.status(400).send({
      message: "please send id",
    }); 
  }
  try {
    const findData = await Post.findOne({ _id: add_comment.id})
    const uservisible = findData.visiblity 
    const showComments = findData.comment
    return res.status(200).json(showComments.map(data => ({
      id: data.id,
      name: !uservisible && data.email === findData.email ?  "Post Author (Anonymous)" : data.name,
      date: new Date(data.date)?.toLocaleDateString('en-IN', options),
      comment: data.comment,
    })));
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});


//////////////// delete post /////////////////////////////

app.delete("/delete", async (req, res) => {

  const {id, email, image} = req.body;

  if (!id || !email) {
    return res.status(400).send({
      message: "please send id & email",
    });
  }
  const imagepath = image.split('/')
  const imageName = imagepath[imagepath.length-1]

  try {

    s3.deleteObject({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: imageName
    }, (err,data) => {})

    const deleteRow = await Post.deleteOne({ _id: id, email: email});
    const deleteNotification = await Notifications.deleteMany({ parent_post_id: id, parent_post_email: email});
    return res.status(200).json({message : "Post has been deleted successfully"});
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

//////////////// states & districts api /////////////////////////////

app.get("/states", async (req, res) => {
  try {
    const stateList = await State.find();
    return res.status(200).json(stateList[0]);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

//////////////// for like & unlike /////////////////////////////

app.post("/liked", async (req, res) => {
  const add_like = {
    id: req.body.id,
    email : req.body.email
  };

  if (!req.body.id || !req.body.email) {
    return res.status(400).send({
      message: "please send id && email",
    });
  }
  try {
    const findById = await Post.findOne({ _id: add_like.id })
    const result = (!findById.liked.includes(add_like.email)) ? 
      await Post.updateOne(
        { _id: add_like.id },
        { $push: { liked: add_like.email }}
      ): await Post.updateOne(
        { _id: add_like.id },
        { $pull: { liked: add_like.email }}
      )
    return res.status(200).json(result);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});


//////////////// for save /////////////////////////////

app.post("/save", async (req, res) => {
  const add_save = {
    id: req.body.id,
    email : req.body.email
  };

  if (!req.body.id || !req.body.email) {
    return res.status(400).send({
      message: "please send id && email",
    });
  }
  try {
    const findById = await Post.findOne({ _id: add_save.id })
    const result = (!findById.saved.includes(add_save.email)) ? 
      await Post.updateOne(
        { _id: add_save.id },
        { $push: { saved: add_save.email }}
      ): await Post.updateOne(
        { _id: add_save.id },
        { $pull: { saved: add_save.email }}
      )

    return res.status(200).json(result);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});


app.get("/your_saved", async (req, res) => {
  const your_saved = {
    saved: req.query.email,
  };

  if (!req.query.email) {
    return res.status(400).send({
      message: "please send email",
    });
  }
  try {
    const getPost = await Post.find({ saved: your_saved.saved });
    return res.status(200).json(
      getPost.map((data) => ({
          id: data.id,
          createdAt: data.createdAt.toLocaleDateString('en-IN', options),
          heading: data.title,
          subheading: data.sub_heading,
          description: data.description,
          name: data.visiblity ? data.name : "Anonymous",
          imagepath: data.imagepath,
          likes: data['liked']?.length,
          comments: data['comment']?.length,
          you_liked: data['liked']?.includes(data.email),
          you_saved: data['saved']?.includes(data.email),
          views: data['ip_address']?.length,
          saves: data['saved']?.length
      })
    ));
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

//////////////// get your posts /////////////////////////////

app.get("/your_articles", async (req, res) => {
  const get_myArticles = {
    myArticle: req.query.email,
  };
  if (!req.query.email) {
    return res.status(400).send({
      message: "please send email",
    });
  }
  try {
    const getPost = await Post.find({ "email": get_myArticles.myArticle });
    return res.status(200).json(
      getPost.map((data) => ({
        id: data.id,
        createdAt: data.createdAt.toLocaleDateString('en-IN', options),
        heading: data.title,
        email: data.email,
        subheading: data.sub_heading,
        description: data.description,
        name: data.visiblity ? data.name : "Anonymous",
        imagepath: data.imagepath,
        likes: data['liked']?.length,
        comments: data['comment']?.length,
        you_liked: data['liked']?.includes(data.email),
        you_saved: data['saved']?.includes(data.email),
        views: data['ip_address']?.length,
        saves: data['saved']?.length,
        requests : data['requests'].map(data => 
          ({
            id: data.id,
            email : (data.email === getPost.email ? data.email : "***********"),
            name: (getPost.visiblity && data.email === getPost.email) ? data.name : "Anonymous",
            imagepath: data.imagepath,
            date: data.date.toLocaleDateString('en-IN', options),
            description: data.description,
          })),
    })
    ));
  } catch (err) {
    // console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

//////////////// for posts views /////////////////////////////

app.post("/take_view", async (req, res) => {
  const add_IP = {
    id: req.body.id,
    ip: req.body.ip,
  };

  if (!req.body.id) {
    return res.status(400).send({
      message: "please send id",
    });
  }
  try {
    const findById = await Post.findOne({ _id: add_IP.id })
    const result = (!findById.ip_address.includes(add_IP.ip)) && 
      await Post.updateOne(
        { _id: add_IP.id },
        { $push: { ip_address: add_IP.ip }}
      )
    return res.status(200).json(result ? "Viewed" : "already Viewed");
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

///////////////// for notifications /////////////////////

app.post('/notification', async (req, res) => {

  const {name, title, parent_post_id} = req.body;
  const findById = await Post.findOne({_id: parent_post_id})
  const parentEmail = findById.email
  try {
    if (!title || !name) {
      return res.status(400).send({
        message: "send title & description",
      });
    }
      const newNotification = {
        name: name,
        title: title,
        parent_post_id: parent_post_id,
        parent_post_email: parentEmail,
        read_status: false,
      };
      const result = await Notifications.create(newNotification);
      return res.status(200).json({message: "success"});
  } catch (error) {
      console.error(error.stack);
      res.status(500).json({ error: error.message });
  }
});

app.get("/get_notifications", async (req, res) => {

  const {email} = req.query;

  if (!email) {
    return res.status(400).send({
      message: "please send email",
    });
  }
  try {
    const getnotifications = await Notifications.find({ parent_post_email: email }).sort({_id: -1});
    return res.status(200).json(
      getnotifications.map((data) => ({
        id: data.id,
        date: data.createdAt.toLocaleDateString('en-IN', options),
        name : data.name,
        postId : data.parent_post_id,
        read : data.read_status,
        title : data.title,
    })));
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.post("/read_notification", async (req, res) => {

  const {email, id} = req.body;

  if (!email || !id) {
    return res.status(400).send({
      message: "please send email & id",
    });
  }
  try {
    const readStatus = await Notifications.updateOne({ parent_post_email : email, _id: id },{ $set : { read_status : true }});
    return res.status(200).json(readStatus);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.delete("/clear_notifications", async (req, res) => {

  const {email} = req.body;

  if (!email) {
    return res.status(400).send({
      message: "please send email",
    });
  }
  try {

    await Notifications.deleteMany({ parent_post_email: email});
    return res.status(200).json({message : "notifications has been deleted successfully"});
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});


///////////////// approved to close /////////////////////

app.post("/apporved", async (req, res) => {

  const {email, id, apporve} = req.body;

  if (!email || !id) {
    return res.status(400).send({
      message: "please send email & id",
    });
  }
  try {
    const readStatus = await Post.updateOne({ email: email, _id: id },{ $set : { status : apporve ? "closed" : "pending" }});
    return res.status(200).json(readStatus);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

///////////////// for reporting /////////////////////

app.post("/reporting", async (req, res) => {
  
  const {email, id} = req.body

  if (!id || !email) {
    return res.status(400).send({
      message: "please send id & email",
    });
  }
  try {
    const findById = await Post.findOne({ _id: id })
    const result = (!findById.report.includes(email)) && 
      await Post.updateOne(
        { _id: id },
        { $push: { report: email }}
      )
    return res.status(200).json({message : result ? "reported successfully" : "you already reported"});
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});


/////////////////////// contact us ////////////////////////////

app.post("/contact_us", async (req, res) => {  
  const {name, mobile, email, message} = req.body

  if (!name || !mobile || !email || !message) {
    return res.status(400).send({
      message: "please fill all details",
    });
  }
  try {

    const newContactus = {
      name: name,
      mobile: mobile,
      email: email,
      message: message,
    };

    await ContactUs.create(newContactus);
    return res.status(200).json({message: "registered successfully"});  
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});



///////////////// google Auth /////////////////////


app.post('/auth/google', async (req, res) => {
  try {
      if (!req.body.code) {
        return res.status(400).send({
          message: "send body code",
        });
      }
  console.log("got request!")
  console.log(req.body.code)
  const tokens = await axios.post("https://oauth2.googleapis.com/token", {
      'code': req.body.code,
      'client_id': CLIENT_ID,
      'client_secret': CLIENT_SECRET,
      'redirect_uri': 'http://localhost:3000',
      'grant_type': 'authorization_code'
  });
  const token = tokens.data.id_token;
  const decoded = jwtDecode(token)
  res.json(decoded);
}catch (err) {
  console.log(err.message);
  res.status(500).send({ message: err.message });
  }
}
);