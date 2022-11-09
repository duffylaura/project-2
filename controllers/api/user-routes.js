const router = require('express').Router();
const { User } = require('../../models');
const { auth } = require('../../utils/auth');
const Post = require('../../models/post');
const Tag = require('../../models/tag');

//logging In
router.post('/login', async (req, res) => {
    const uEmail = req.body.email;
    const uPW = req.body.pw;
    try {
        //find the user in db if email exists
        const userData = await User.findOne({
            where: { email: uEmail }
        });
        //if user don't exisst
        if (!userData) {
            res.status(400).json({ message: `Uable to find user with that email ${uEmail} does not exists` });
            return;
        };
        //otherwie if user exists use bcrypt to compare password
        const validPassword = await userData.comparePW(uPW); //this returns boolean

        if (!validPassword) {
            res.status(400).json({ message: `Wrong password. Plz try again` });
            return;
        } else {
            req.session.save(() => {
                req.session.user_id = userData.id;
                req.session.logged_in = true;
                res.json({ user: userData, message: `Welcome Back! ~${userData.username}~` })
            });
        }
    } catch (err) {
        res.status(400).json(err);
    }
});
//signup
router.post('/signup', async (req, res) => {
    try {
        const nUser = {
            "username": req.body.username,
            'email': req.body.email,
            'password': req.body.pw,
        }

        const newUserData = await User.create(nUser);
        res.status(200).json(`${nUser.username}'s account has been created`);
    } catch (err) {
        res.status(500).json(err);
    };

});

//get User by username, protected and will redirect if not logged in
router.get('/:username', auth, async (req, res) => {
    try {
        const selectedUserName = req.params.username;

        const userData = await User.findOne({
            include: [{
                model: Post,
                attributes: ["id", "title", "img_url", "body"]
            }, {
                model: Tag,
                attribute: ["id", "title"]
            }],
            where: { username: selectedUserName }
        });

        const displayUserPosts = userData.get({ plain: true });
        console.log(displayUserPosts);
        res.render('otherprofile', {
            displayUserPosts
        });
        //catach error as usual
    } catch (err) {
        res.status(500).json(err);
    }
})

//logout route
router.post('/logout', (req, res) => {
    if (req.session.logged_in) { // confirming if actuallu loggedIN, 
        req.session.destroy(() => { //remove the current loggedIn session
            res.status(204).end();
        });
    } else {
        res.status(404).json('error not loggedin').end();
    };
});

//future dev: 
//maybe delete user

module.exports = router;
