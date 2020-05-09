const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/auth");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @Route POST api/profile
// @desc créer ou update un profil
// @access Privé
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status obligé...").not().isEmpty(),
      check("skills", "Les skills c'est obligatoire").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // construction du profil
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.company = company;
    if (location) profileFields.location = location;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        // on l'update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields }
        );
        return res.json(profile);
      }
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(errors);
      return res.status(500).send("Server error");
    }
  }
);

// @Route GET api/profile
// @desc voir tous les profils
// @access Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @Route GET api/profile/user/:user_id
// @desc voir un profil
// @access Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "No profile... sorry dude" });
    }
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == "ObjectId") {
      return res.status(400).json({ msg: "Le profil n'existe pas :/" });
    }
    res.status(500).send("Server Error");
  }
});

// @Route DELETE api/profile/user/:user_id
// @desc supprimer un profil, utilisateur et ses posts
// @access Privé
router.delete("/", auth, async (req, res) => {
  try {
    // A FAIRE Remove posts user

    // Supprime le profil
    await Profile.findOneAndRemove({ user: req.user.id });
    // Supprime l'utilisateur
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

// @Route PUT api/profile/experience
// @desc supprimer un profil, utilisateur et ses posts
// @access Privé
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Le titre est requis"),
      check("company", "La boite est requiss"),
      check("from", "La date de début est obligatoire"),
      check("to", "La date de fin est obligatoire"),
      check("current", "Han ouais"),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      // TODO AJOUTER LA DATE DE CREATION
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @Route DELETE api/profile/experience/:exp_id
// @desc supprimer une experience
// @access Privé
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const indexToRemove = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(indexToRemove);

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
