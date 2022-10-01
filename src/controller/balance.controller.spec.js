const app = require('../app.js');
const request = require('supertest');
const { Profile, Contract, Job } = require('../model');

const depositRequest = (profileId, amount) => {
  return request(app).post(`/balances/deposit/${profileId}`).set('profile_id', profileId).send({ amount });
};

describe('BalanceController', () => {
  let clientProfile1;
  let clientProfile2;
  let contractorProfile1;
  let contractorProfile2;

  beforeEach(async () => {
    await Profile.sync({ force: true });
    await Contract.sync({ force: true });
    await Job.sync({ force: true });

    clientProfile1 = await Profile.create({
      id: 1,
      firstName: 'Harry',
      lastName: 'Potter',
      profession: 'Wizard',
      balance: 1000,
      type: 'client',
    });
    clientProfile2 = await Profile.create({
      id: 4,
      firstName: 'Ash',
      lastName: 'Kethcum',
      profession: 'Pokemon master',
      balance: 1.3,
      type: 'client',
    });
    contractorProfile1 = await Profile.create({
      id: 5,
      firstName: 'John',
      lastName: 'Lenon',
      profession: 'Musician',
      balance: 10,
      type: 'contractor',
    });
    contractorProfile2 = await Profile.create({
      id: 7,
      firstName: 'Alan',
      lastName: 'Turing',
      profession: 'Programmer',
      balance: 20,
      type: 'contractor',
    });
  });

  describe('/balances/deposit/:profileId', () => {
    it('should return 403 if user is not client type', async () => {
      const res = await depositRequest(contractorProfile1.id, 0);
      expect(res.statusCode).toEqual(403);
    });

    it('should return 401 if user not equal to profile token user', async () => {
      const res = await request(app).post(`/balances/deposit/${clientProfile1.id}`).set('profile_id', clientProfile2.id);
      expect(res.statusCode).toEqual(401);
    });

    it('should return 401 if bad amount', async () => {
      let res = await depositRequest(clientProfile1.id, undefined);
      expect(res.statusCode).toEqual(401);

      res = await depositRequest(clientProfile1.id, 0);
      expect(res.statusCode).toEqual(401);

      res = await depositRequest(clientProfile1.id, -1);
      expect(res.statusCode).toEqual(401);

      res = await depositRequest(clientProfile1.id, '1');
      expect(res.statusCode).toEqual(401);

      res = await depositRequest(clientProfile1.id, 0.001);
      expect(res.statusCode).toEqual(401);
    });

    it('should deposit lte 25% total of jobs to pay', async () => {
      const contractActive1 = await Contract.create({
        id: 1,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: clientProfile1.id,
        ContractorId: contractorProfile1.id,
      });
      await Job.create({
        description: 'work',
        price: 200,
        paid: true,
        paymentDate: '2020-08-15T19:11:26.737Z',
        ContractId: contractActive1.id,
      });
      const job1 = await Job.create({
        description: 'work',
        price: 700,
        ContractId: contractActive1.id,
      });

      const contractActive2 = await Contract.create({
        id: 2,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: clientProfile1.id,
        ContractorId: contractorProfile2.id,
      });
      await Job.create({
        description: 'work',
        price: 210,
        paid: true,
        paymentDate: '2020-08-15T19:11:26.737Z',
        ContractId: contractActive2.id,
      });
      const job2 = await Job.create({
        description: 'work',
        price: 300,
        ContractId: contractActive2.id,
      });

      const contractNew = await Contract.create({
        id: 3,
        terms: 'bla bla bla',
        status: 'new',
        ClientId: clientProfile1.id,
        ContractorId: contractorProfile1.id,
      });
      await Job.create({
        description: 'work',
        price: 100,
        ContractId: contractNew.id,
      });

      const contractTerminated = await Contract.create({
        id: 4,
        terms: 'bla bla bla',
        status: 'terminated',
        ClientId: clientProfile1.id,
        ContractorId: contractorProfile1.id,
      });
      await Job.create({
        description: 'work',
        price: 100,
        ContractId: contractTerminated.id,
      });

      const contractActive3 = await Contract.create({
        id: 5,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: clientProfile2.id,
        ContractorId: contractorProfile2.id,
      });
      await Job.create({
        description: 'work',
        price: 100,
        ContractId: contractActive3.id,
      });

      let res = await depositRequest(clientProfile1.id, (job1.price + job2.price) * 0.25 + 0.01);
      expect(res.statusCode).toEqual(403);

      res = await depositRequest(clientProfile1.id, (job1.price + job2.price) * 0.25);
      expect(res.statusCode).toEqual(200);

      const updatedProfile = await Profile.findOne({ where: { id: clientProfile1.id } });
      expect(updatedProfile.balance).toEqual(clientProfile1.balance + (job1.price + job2.price) * 0.25);
    });
  });
});
