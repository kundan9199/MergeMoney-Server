const userDao = require('../dao/userDao');

const usersController = {
  getUserInfo: async (request, response) => {
    try {
      const email = request.user.email;

      const user = await userDao.findByEmail(email);

      return response.json({ user });
    } catch (error) {
      return response.status(500).json({ message: 'Internal server error' });
    }
  },
};

module.exports = usersController;