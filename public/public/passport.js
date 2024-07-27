const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Adjust the path based on your project structure

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ registerUsername: username });

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.registerPassword);

      if (!passwordMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
