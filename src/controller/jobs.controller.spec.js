const app = require('../app.js');
const request = require('supertest');
const { Profile, Contract, Job } = require('../model');
const { normalize } = require('../test/common');

const getUnpaidRequest = (profileId) => {
  return request(app).get('/jobs/unpaid').set('profile_id', profileId);
};
const makePaymentRequest = (jobId, profileId) => {
  return request(app).post(`/jobs/${jobId}/pay`).set('profile_id', profileId);
};

describe('JobsController', () => {
  let clientProfile;
  let contractorProfile1;
  let contractorProfile2;

  beforeEach(async () => {
    await Profile.sync({ force: true });
    await Contract.sync({ force: true });
    await Job.sync({ force: true });

    clientProfile = await Profile.create({
      id: 1,
      firstName: 'Harry',
      lastName: 'Potter',
      profession: 'Wizard',
      balance: 1000,
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

  describe('/jobs/unpaid', () => {
    it('should receive unpaid jobs', async () => {
      const contractActive1 = await Contract.create({
        id: 2,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile1.id,
      });
      const contractActive2 = await Contract.create({
        id: 3,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile2.id,
      });
      const contractNew = await Contract.create({
        id: 4,
        terms: 'bla bla bla',
        status: 'new',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile2.id,
      });
      const contractTerminated = await Contract.create({
        id: 5,
        terms: 'bla bla bla',
        status: 'terminated',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile2.id,
      });

      await Job.create({
        description: 'work',
        price: 200,
        paid: true,
        paymentDate: '2020-08-15T19:11:26.737Z',
        ContractId: contractActive1.id,
      });
      const job2 = await Job.create({
        description: 'work',
        price: 201,
        ContractId: contractActive1.id,
      });
      const job3 = await Job.create({
        description: 'work',
        price: 300,
        ContractId: contractActive2.id,
      });
      await Job.create({
        description: 'work',
        price: 400,
        ContractId: contractNew.id,
      });
      await Job.create({
        description: 'work',
        price: 500,
        ContractId: contractTerminated.id,
      });

      let res = await getUnpaidRequest(clientProfile.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize([job2, job3]));

      res = await getUnpaidRequest(contractorProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize([job2]));

      res = await getUnpaidRequest(contractorProfile2.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize([job3]));
    });
  });

  describe('/jobs/:jobId/pay', () => {
    it('should return 404 if job not belong to the user', async () => {
      const anotherClientProfile = await Profile.create({
        id: 4,
        firstName: 'Ash',
        lastName: 'Kethcum',
        profession: 'Pokemon master',
        balance: 1.3,
        type: 'client',
      });
      const contract = await Contract.create({
        id: 1,
        terms: 'bla bla bla',
        status: 'new',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile1.id,
      });
      const job = await Job.create({
        description: 'work',
        price: 200,
        ContractId: contract.id,
      });

      const res = await makePaymentRequest(job.id, anotherClientProfile.id);
      expect(res.statusCode).toEqual(404);
    });

    it('should return 403 if user is not client type', async () => {
      const contract = await Contract.create({
        id: 1,
        terms: 'bla bla bla',
        status: 'new',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile1.id,
      });
      const job = await Job.create({
        description: 'work',
        price: 200,
        ContractId: contract.id,
      });

      const res = await makePaymentRequest(job.id, contractorProfile1.id);
      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 if job not found', async () => {
      const contract = await Contract.create({
        id: 2,
        terms: 'bla bla bla',
        status: 'new',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile1.id,
      });
      const job = await Job.create({
        description: 'work',
        price: 200,
        ContractId: contract.id,
      });

      const res = await makePaymentRequest(job.id + 1, clientProfile.id);
      expect(res.statusCode).toEqual(404);
    });

    it('should return 403 if job already paid', async () => {
      const contract = await Contract.create({
        id: 2,
        terms: 'bla bla bla',
        status: 'new',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile1.id,
      });
      const job = await Job.create({
        description: 'work',
        price: 200,
        paid: true,
        paymentDate: '2020-08-15T19:11:26.737Z',
        ContractId: contract.id,
      });

      const res = await makePaymentRequest(job.id, clientProfile.id);
      expect(res.statusCode).toEqual(403);
    });

    it('should return 403 if client has no funds', async () => {
      const clientProfile = await Profile.create({
        id: 3,
        firstName: 'Harry',
        lastName: 'Potter',
        profession: 'Wizard',
        type: 'client',
      });
      const contract = await Contract.create({
        id: 2,
        terms: 'bla bla bla',
        status: 'new',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile1.id,
      });
      const job = await Job.create({
        description: 'work',
        price: 100,
        ContractId: contract.id,
      });

      let res = await makePaymentRequest(job.id, clientProfile.id);
      expect(res.statusCode).toEqual(403);

      await clientProfile.update({ balance: 99.99 });
      res = await makePaymentRequest(job.id, clientProfile.id);
      expect(res.statusCode).toEqual(403);

      await clientProfile.update({ balance: 100 });
      res = await makePaymentRequest(job.id, clientProfile.id);
      expect(res.statusCode).toEqual(200);
    });

    it('should do payment and money transfer from client to contractor', async () => {
      const contract = await Contract.create({
        id: 2,
        terms: 'bla bla bla',
        status: 'in_progress',
        ClientId: clientProfile.id,
        ContractorId: contractorProfile1.id,
      });
      const job = await Job.create({
        description: 'work',
        price: 200,
        ContractId: contract.id,
      });

      let res = await getUnpaidRequest(clientProfile.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize([job]));

      res = await makePaymentRequest(job.id, clientProfile.id);
      expect(res.statusCode).toEqual(200);

      res = await getUnpaidRequest(clientProfile.id);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);

      const client = await Profile.findOne({ where: { id: clientProfile.id, balance: 800 } });
      expect(client).not.toBeNull();

      const contractor = await Profile.findOne({ where: { id: contractorProfile1.id, balance: 210 } });
      expect(contractor).not.toBeNull();
    });
  });
});
