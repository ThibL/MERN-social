const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/auth");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @Route POST api/posts
// @desc create post
// @access private
router.post(
  "/",
  [auth, [check("text", "Entrez un texte").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @Route GET api/posts
// @desc Get all posts
// @access private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @Route Get api/posts/:id
// @desc get a post
// @access private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "There is no post" });
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "There is no post" });
    }
    res.status(500).send("Server Error");
  }
});

// @Route DELETE api/posts/:id
// @desc delete a post
// @access private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Vérifie si l'utilisateur qui supprime est celui qui a créé
    if (post.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: "You can only delete your own posts" });
    }
    await post.remove();
    res.json({ msg: "Post removed" });
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "There is no post to delete" });
    }
    res.status(500).send("Server Error");
  }
});

// @Route PUT api/posts/like/:id
// @desc like a post
// @access private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Verifie si le post est déjà liké
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.json({ msg: "Post already liked" });
    }
    post.likes.unshift({ user: req.user.id });

    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// @Route PUT api/posts/unlike/:id
// @desc unlike a post
// @access private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Verifie si le post est déjà liké
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.json({ msg: "Post has not been liked" });
    }

    const indexToRemove = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(indexToRemove, 1);

    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

// @Route POST api/posts/comment/:id
// @desc comment on a post
// @access private
router.post(
  "/comment/:id",
  [auth, [check("text", "Entrez un texte").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const post = await Post.findById(req.params.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      post.comments.unshift(newComment);
      await post.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @Route DELETE api/posts/comment/:id/:comment_id
// @desc delete a comment
// @access private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    // On vérifie si le commentaire existe
    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    // check l'utilisateur
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Récupérer l'index
    const indexToRemove = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(indexToRemove, 1);

    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
