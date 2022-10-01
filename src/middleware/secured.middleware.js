module.exports = {
  apply: (roles = []) => {
    return async function (req, res, next) {
      if (roles.length) {
        const profileId = req.get('profile_id');
        const { Profile } = req.app.get('models');
        const profile = await Profile.findOne({
          where: {
            id: profileId || 0,
          },
        });
        if (!profile) {
          return res.status(401).send('Not authorized');
        }
        if (roles.length && !roles.includes(profile.type)) {
          return res.status(403).send('Forbidden');
        }
        req.profile = profile;
      }

      next();
    };
  },
};
