const { ForbiddenException, BadRequestException } = require('./exception');
const { Op } = require('sequelize');
const { sequelize } = require('../model');

const validateAmount = (amount) => {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0 || (amount * 100) % 1 > 0) {
    throw new BadRequestException('`amount` must be a positive value with max 2 digits after period');
  }
};

module.exports = function (action) {
  /**
   * POST /balances/deposit/:userId - Deposits money into the balance of a client,
   * a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
   */
  action.post('/balances/deposit/:profileId', ['client'], async (req) => {
    const { Profile, Contract, Job } = req.app.get('models');
    const { profileId } = req.params;
    const { amount } = req.body;

    if (profileId !== String(req.profile.id)) {
      throw new BadRequestException('Bad client `userId`');
    }
    validateAmount(amount);

    const jobs = await Job.findAll({
      attributes: [[sequelize.fn('sum', sequelize.col('price')), 'price']],
      include: {
        model: Contract,
        required: true,
        attributes: [],
      },
      where: {
        paid: {
          [Op.or]: [null, false],
        },
        '$Contract.status$': 'in_progress',
        '$Contract.ClientId$': profileId,
      },
    });
    if (!jobs || !jobs[0]?.price || jobs[0].price * 0.25 < amount) {
      throw new ForbiddenException(
        `Please check if you have active jobs to pay for. You are allowed to deposit not more than 25% total of jobs to pay.`,
      );
    }
    await Profile.increment({ balance: amount }, { where: { id: profileId } });
  });
};
