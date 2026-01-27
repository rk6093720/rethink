// config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { UserAuthModal } = require("../modals/user.modals");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:6001/users/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await UserAuthModal.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // create new google user
        user = await UserAuthModal.create({
          googleId: profile.id,
          displayName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
          provider: "google",
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// 🔁 Session handling (required)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserAuthModal.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
