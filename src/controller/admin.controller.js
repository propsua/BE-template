const { Op } = require('sequelize');
const { BadRequestException } = require('./exception');
const { DateTime } = require('luxon');
const { Profile, sequelize } = require('../model');

const validateDate = (dateStr) => {
  const instance = DateTime.fromISO(dateStr);
  if (instance.isValid) {
    return instance;
  }

  throw new BadRequestException(`'${dateStr}' is invalid date`);
};
const validateDateRange = (start, end) => {
  if (start >= end) {
    throw new BadRequestException(`Start date '${start}' should be less than End date ${end}`);
  }
};
const validateLimit = (limitStr) => {
  if (!limitStr) {
    return;
  }

  const limit = parseInt(limitStr);
  if (!Number.isNaN(limit) && limit > 0) {
    return limit;
  }

  throw new BadRequestException(`Limit '${limitStr}' must be a positive integer`);
};

module.exports = function (action) {
  /**
   * ***GET*** `/admin/best-profession?start=<date>&end=<date>` - Returns the profession that earned the most money (sum of jobs paid) for any
   * contactor that worked in the query time range.
   */
  action.get('/admin/best-profession', ['admin'], async (req) => {
    const { Contract, Job } = req.app.get('models');
    const start = validateDate(req.query.start);
    const end = validateDate(req.query.end);
    validateDateRange(start, end);

    const profile = await Profile.findOne({
      attributes: ['profession', [sequelize.fn('sum', sequelize.col('Contractor.Jobs.price')), 'total']],
      group: ['profession'],
      order: [['total', 'DESC']],
      subQuery: false,
      include: {
        model: Contract,
        required: true,
        attributes: [],
        as: 'Contractor',
        include: {
          model: Job,
          required: true,
          attributes: [],
          where: {
            paid: true,
            paymentDate: {
              [Op.gte]: start.toJSDate(),
              [Op.lt]: end.toJSDate(),
            },
          },
        },
      },
    });

    return {
      profession: profile.profession,
    };
  });

  /**
   * ***GET*** `/admin/best-clients?start=<date>&end=<date>&limit=<integer>` - returns the clients the paid the most for jobs in the query time period.
   * Limit query parameter should be applied, default limit is 2.
   */
  action.get('/admin/best-clients', ['admin'], async (req) => {
    const { Contract, Job } = req.app.get('models');
    const start = validateDate(req.query.start);
    const end = validateDate(req.query.end);
    validateDateRange(start, end);
    const limit = validateLimit(req.query.limit) || 2;

    const clients = await Profile.findAll({
      attributes: [[sequelize.col('Profile.id'), 'pid'], 'firstName', 'lastName', [sequelize.fn('sum', sequelize.col('Client.Jobs.price')), 'total']],
      group: ['pid', 'firstName', 'lastName'],
      order: [['total', 'DESC']],
      subQuery: false,
      limit,
      include: {
        model: Contract,
        required: true,
        attributes: [],
        as: 'Client',
        include: {
          model: Job,
          required: true,
          attributes: [],
          where: {
            paid: true,
            paymentDate: {
              [Op.gte]: start.toJSDate(),
              [Op.lt]: end.toJSDate(),
            },
          },
        },
      },
    });

    return clients.map((c) => ({
      id: c.getDataValue('pid'),
      fullName: `${c.firstName} ${c.lastName}`.trim(),
      paid: c.getDataValue('total'),
    }));
  });
};
