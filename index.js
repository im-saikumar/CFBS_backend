import express from "express";
import { PORT } from "./config.js";
import mongoose from "mongoose";
import { mongoDBURL } from "./config.js";
import { Post } from "./post.js";
import { State } from "./states.js";
// import multer from "multer";
import AWS from "aws-sdk"


const app = express();
app.use(express.json());

const options = {
  // weekday: 'long',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

// app.get("/", (req, res) => {
//   console.log(req);
//   return res.status(200).send("welcome");
// });

////////////////////// test /////////////////////////

app.get('/', (req, res) => {
  res.send(`
    <h2>File Upload With <code>"Node.js"</code></h2>
    <form action="/upload" enctype="multipart/form-data" method="post">
      <div>Select a file: 
        <input type="file" name="file" multiple="multiple" />
      </div>
      <input type="submit" value="Upload" />
    </form>

  `);
});

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// const upload = multer({ storage: storage, fileFilter: fileFilter });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

app.post('/upload',  async (req, res) => {
  const file = req.file;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  try {
    await s3.upload(params).promise();
    res.status(200).send('File uploaded to S3 successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file to S3');
  }
});

///////////////// end /////////////////

//////////////////////////////// connection ////////////////

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log("DB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));

app.post("/post", async (req, res) => {
  try {
    if (!req.body.title || !req.body.description) {
      return res.status(400).send({
        message: "send title & description",
      });
    }
    const newPost = {
      title: req.body.title,
      description: req.body.description,
      comment: null,
      liked: null,
      saved: null,
    };
    const result = await Post.create(newPost);
    return res.status(200).send(result);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.get("/post", async (req, res) => {
  const username = "ram"
  try {
    const getPost = await Post.find({});
    return res
      .status(200)
      .json(
        getPost.map((data) => ({
          id: data.id,
          createdAt: data.createdAt.toLocaleDateString('en-IN', options),
          name: data.title,
          description: data.description,
          likes: data.liked?.length,
          comments: data.comment?.length,
          you_liked: data.liked.includes(username),
          you_saved: data.saved.includes(username),
          views: data.ip_address.length,
          saves: data.saved
        }))
      );
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.get("/post_details", async (req, res) => {
  const post_details = {
    id: req.body.id,
  };

  if (!req.body.id) {
    return res.status(400).send({
      message: "please send id",
    });
  }

  try {
    const getPost = await Post.findOne({ _id: post_details.id },{ip_address : 0});
    return res.status(200).json(getPost);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.post("/add_comment", async (req, res) => {
  const add_comment = {
    id: req.body.id,
    comment: req.body.comment,
  };

  if (!req.body.id || !req.body.comment) {
    return res.status(400).send({
      message: "please send id & comment",
    });
  }
  try {
    const addComment = await Post.updateOne(
      { _id: add_comment.id },
      {
        $push: {
          comment: {
            name: "ram",
            date: new Date(),
            comment: add_comment.comment,
          },
        },
      }
    );
    return res.status(200).json(addComment);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.get("/get_comments", async (req, res) => {
  const add_comment = {
    id: req.body.id,
  };

  if (!req.body.id) {
    return res.status(400).send({
      message: "please send id & comment",
    });
  }
  try {
    const addComment = await Post.findOne({ _id: add_comment.id });
    return res.status(200).json(addComment.comment);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.delete("/delete", async (req, res) => {
  const deleteById = {
    id: req.body.id,
  };

  if (!req.body.id) {
    return res.status(400).send({
      message: "please send id",
    });
  }
  try {
    const deleteRow = await Post.deleteOne({ _id: deleteById.id });
    return res.status(200).json(deleteRow);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.get("/states", async (req, res) => {
  try {
    const stateList = await State.find();
    return res.status(200).json(stateList[0]);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.post("/liked", async (req, res) => {
  const add_like = {
    id: req.body.id,
    name: "shyam"
  };

  if (!req.body.id) {
    return res.status(400).send({
      message: "please send id",
    });
  }
  try {
    const findById = await Post.findOne({ _id: add_like.id })
    const result = (!findById.liked.includes(add_like.name)) ? 
      await Post.updateOne(
        { $push: { liked: add_like.name }}
      ): await Post.updateOne(
        { $pull: { liked: add_like.name }}
      )
    return res.status(200).json(result);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});


app.post("/save", async (req, res) => {
  const add_save = {
    id: req.body.id,
    name : "shyam"
  };

  if (!req.body.id) {
    return res.status(400).send({
      message: "please send id",
    });
  }
  try {
    const findById = await Post.findOne({ _id: add_save.id })
    const result = (!findById.saved.includes(add_save.name)) ? 
      await Post.updateOne(
        { $push: { saved: add_save.name }}
      ): await Post.updateOne(
        { $pull: { saved: add_save.name }}
      )

    return res.status(200).json(result);
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});


app.get("/get_saved", async (req, res) => {
  const get_saved = {
    saved: req.body.saved,
  };

  const username = "ram"

  if (!req.body.saved) {
    return res.status(400).send({
      message: "please send saved name",
    });
  }
  try {
    const data = await Post.findOne({ saved: get_saved.saved });
    return res.status(200).json({
          id: data.id,
          createdAt: data.createdAt.toLocaleDateString('en-IN', options),
          name: data.title,
          description: data.description,
          likes: data.liked?.length,
          comments: data.comment?.length,
          you_liked: data.liked.includes(username),
          you_saved: data.saved.includes(username),
          views: data.ip_address.length,
          saves: data.saved.length
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

app.post("/take_view", async (req, res) => {
  const add_IP = {
    id: req.body.id,
    ip: "125.46.869"
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
        { $push: { ip_address: add_IP.ip }}
      )
    
    return res.status(200).json(result ? result : "alread Viewed");
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ message: err.message });
  }
});

// app.post("/auth/google", async (req, res) => {
//   console.log("got request!");
//   console.log(req.body.code);
//   try {
//     if (!req.body.code) {
//       return res.status(400).send({
//         message: "send body code",
//       });
//     }
//     const tokens = await app.post("https://oauth2.googleapis.com/token", {
//       code: req.body.code,
//       client_id: CLIENT_ID,
//       client_secret: CLIENT_SECRET,
//       redirect_uri: "postmessage",
//       grant_type: "authorization_code",
//     });
//     if (!tokens) {
//       return res.status(400).send({ message: "not found" });
//     }
//     console.log(tokens);
//     res.json(tokens);
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send({ message: err.message });
//   }
// });
