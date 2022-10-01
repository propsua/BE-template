const { NotFoundException } = require('./exception');
const { Op } = require('sequelize');

module.exports = function (action) {
  /**
   * GET /contracts - Returns a list of contracts belonging to a user (client or contractor), the list should only contain non terminated contracts.
   */
  action.get('/contracts', ['client', 'contractor'], async (req) => {
    const { Contract } = req.app.get('models');
    const profileId = req.profile.id;

    return Contract.findAll({
      order: ['id'],
      where: {
        status: {
          [Op.ne]: 'terminated',
        },
        [Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
      },
    });
  });

  /**
   * GET /contracts/:id - This API is broken 😵! it should return the contract only if it belongs to the profile calling. better fix that!
   */
  action.get('/contracts/:id', ['client', 'contractor'], async (req) => {
    const { Contract } = req.app.get('models');
    const { id } = req.params;
    const profileId = req.profile.id;

    const contract = await Contract.findOne({
      where: {
        id,
        [Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
      },
    });
    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }
    return contract;
  });
};
