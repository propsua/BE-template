const { Op } = require('sequelize');
const { ForbiddenException, NotFoundException } = require('./exception');

module.exports = function (action) {
  /**
   * GET /jobs/unpaid - Get all unpaid jobs for a user (either a client or contractor), for active contracts only.
   */
  action.get('/jobs/unpaid', ['client', 'contractor'], async (req) => {
    const { Contract, Job } = req.app.get('models');
    const profileId = req.profile.id;

    return Job.findAll({
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
        [Op.or]: [{ '$Contract.ClientId$': profileId }, { '$Contract.ContractorId$': profileId }],
      },
    });
  });

  /**
   * POST /jobs/:job_id/pay - Pay for a job, a client can only pay if his balance >= the amount to pay.
   * The amount should be moved from the client's balance to the contractor balance.
   */
  action.post('/jobs/:jobId/pay', ['client'], async (req) => {
    const { Profile, Contract, Job } = req.app.get('models');
    const { jobId } = req.params;
    const profileId = req.profile.id;

    const job = await Job.findOne({
      lock: true,
      include: {
        model: Contract,
        required: true,
      },
      where: {
        id: jobId,
        '$Contract.ClientId$': profileId,
      },
    });
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    if (job.paid) {
      throw new ForbiddenException(`Job ${jobId} has been already paid`);
    }

    const clientProfile = await Profile.findOne({
      lock: true,
      where: {
        id: job.Contract.ClientId,
      },
    });

    if (!clientProfile.balance || job.price > clientProfile.balance) {
      throw new ForbiddenException(`Not enough funds`);
    }

    await Profile.decrement({ balance: job.price }, { where: { id: job.Contract.ClientId } });
    await Profile.increment({ balance: job.price }, { where: { id: job.Contract.ContractorId } });

    job.paid = true;
    job.paymentDate = new Date();

    await job.save();
  });
};
