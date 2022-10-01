const app = require('../app.js');
const request = require('supertest');
const { Profile, Contract } = require('../model');
const { normalize } = require('../test/common');

const getContractsRequest = (profileId) => {
  return request(app).get('/contracts').set('profile_id', profileId);
};
const getContractRequest = (contractId, profileId) => {
  return request(app).get(`/contracts/${contractId}`).set('profile_id', profileId);
};

describe('ContractController', () => {
  let clientProfile1;
  let clientProfile2;
  let contractorProfile1;
  let contractorProfile2;

  let contractActive1;
  let contractActive2;
  let contractNew;
  let contractTerminated;

  beforeEach(async () => {
    await Profile.sync({ force: true });
    await Contract.sync({ force: true });

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

    contractActive1 = await Contract.create({
      id: 1,
      terms: 'bla bla bla',
      status: 'in_progress',
      ClientId: clientProfile1.id,
      ContractorId: contractorProfile1.id,
    });
    contractActive2 = await Contract.create({
      id: 2,
      terms: 'bla bla bla',
      status: 'in_progress',
      ClientId: clientProfile1.id,
      ContractorId: contractorProfile1.id,
    });
    contractNew = await Contract.create({
      id: 3,
      terms: 'bla bla bla',
      status: 'new',
      ClientId: clientProfile1.id,
      ContractorId: contractorProfile1.id,
    });
    contractTerminated = await Contract.create({
      id: 4,
      terms: 'bla bla bla',
      status: 'terminated',
      ClientId: clientProfile1.id,
      ContractorId: contractorProfile1.id,
    });

    await Contract.create({
      id: 5,
      terms: 'bla bla bla',
      status: 'in_progress',
      ClientId: clientProfile2.id,
      ContractorId: contractorProfile2.id,
    });
  });

  describe('/contracts', () => {
    it('should receive client non terminated contracts', async () => {
      const res = await getContractsRequest(clientProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize([contractActive1, contractActive2, contractNew]));
    });

    it('should receive contractor non terminated contracts', async () => {
      const res = await getContractsRequest(contractorProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize([contractActive1, contractActive2, contractNew]));
    });
  });

  describe('/contracts/:id', () => {
    it('should receive 404 if no contract found', async () => {
      const res = await getContractRequest(contractActive1 + 100, clientProfile1.id);
      expect(res.statusCode).toEqual(404);
    });

    it('should receive client contract', async () => {
      let res = await getContractRequest(contractActive1.id, clientProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize(contractActive1));

      res = await getContractRequest(contractNew.id, clientProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize(contractNew));

      res = await getContractRequest(contractTerminated.id, clientProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize(contractTerminated));
    });

    it('should receive contractor contract', async () => {
      let res = await getContractRequest(contractActive1.id, contractorProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize(contractActive1));

      res = await getContractRequest(contractNew.id, contractorProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize(contractNew));

      res = await getContractRequest(contractTerminated.id, contractorProfile1.id);
      expect(res.statusCode).toEqual(200);
      expect(normalize(res.body)).toEqual(normalize(contractTerminated));
    });
  });
});
