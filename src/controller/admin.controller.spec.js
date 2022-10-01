const app = require('../app.js');
const request = require('supertest');
const { Profile, Contract, Job } = require('../model');

const getBestProfessionRequest = (profileId, requestParams) => {
  return request(app).get('/admin/best-profession').set('profile_id', profileId).query(requestParams);
};
const getBestClientsRequest = (profileId, requestParams) => {
  return request(app).get('/admin/best-clients').set('profile_id', profileId).query(requestParams);
};

describe('AdminController', () => {
  let adminProfile;
  let clientProfile1;
  let clientProfile2;
  let contractorProfile1;
  let contractorProfile2;
  let job1;
  let job2;
  let job3;
  let job4;
  let job6;
  let job7;
  let job8;
  let job9;

  beforeEach(async () => {
    await Profile.sync({ force: true });
    await Contract.sync({ force: true });
    await Job.sync({ force: true });

    adminProfile = await Profile.create({
      id: 1,
      firstName: 'Serhiy',
      lastName: 'Prokopovych',
      profession: 'Programmer',
      balance: 1000000,
      type: 'admin',
    });
    clientProfile1 = await Profile.create({
      id: 2,
      firstName: 'Harry',
      lastName: 'Potter',
      profession: 'Wizard',
      balance: 1000,
      type: 'client',
    });
    clientProfile2 = await Profile.create({
      id: 3,
      firstName: 'Ash',
      lastName: 'Kethcum',
      profession: 'Pokemon master',
      balance: 1.3,
      type: 'client',
    });
    contractorProfile1 = await Profile.create({
      id: 4,
      firstName: 'John',
      lastName: 'Lenon',
      profession: 'Musician',
      balance: 10,
      type: 'contractor',
    });
    contractorProfile2 = await Profile.create({
      id: 5,
      firstName: 'Alan',
      lastName: 'Turing',
      profession: 'Programmer',
      balance: 20,
      type: 'contractor',
    });

    // first contractor jobs
    const contractActive1 = await Contract.create({
      id: 1,
      terms: 'bla bla bla',
      status: 'in_progress',
      ClientId: clientProfile1.id,
      ContractorId: contractorProfile1.id,
    });
    // job1 to account
    job1 = await Job.create({
      description: 'work',
      price: 100,
      paid: true,
      paymentDate: '2022-01-01T10:11:26.737Z',
      ContractId: contractActive1.id,
    });
    await Job.create({
      description: 'work',
      price: 700,
      ContractId: contractActive1.id,
    });
    // job2 to account
    job2 = await Job.create({
      description: 'work',
      price: 110,
      paid: true,
      paymentDate: '2022-01-01T11:11:26.737Z',
      ContractId: contractActive1.id,
    });
    // job3 to account
    job3 = await Job.create({
      description: 'work',
      price: 120,
      paid: true,
      paymentDate: '2022-01-03T19:11:26.737Z',
      ContractId: contractActive1.id,
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
      ClientId: clientProfile2.id,
      ContractorId: contractorProfile1.id,
    });
    // job4 to account
    job4 = await Job.create({
      description: 'work',
      price: 310,
      paid: true,
      paymentDate: '2022-03-01T19:11:26.737Z',
      ContractId: contractTerminated.id,
    });

    //second contractor jobs
    const contractActive3 = await Contract.create({
      id: 5,
      terms: 'bla bla bla',
      status: 'in_progress',
      ClientId: clientProfile2.id,
      ContractorId: contractorProfile2.id,
    });
    // job6 to account
    job6 = await Job.create({
      description: 'work',
      price: 100,
      paid: true,
      paymentDate: '2022-01-03T10:11:26.737Z',
      ContractId: contractActive3.id,
    });
    await Job.create({
      description: 'work',
      price: 1000,
      ContractId: contractActive3.id,
    });
    // job7 to account
    job7 = await Job.create({
      description: 'work',
      price: 110,
      paid: true,
      paymentDate: '2022-01-04T11:11:26.737Z',
      ContractId: contractActive3.id,
    });
    // job8 to account
    job8 = await Job.create({
      description: 'work',
      price: 220,
      paid: true,
      paymentDate: '2022-01-05T19:11:26.737Z',
      ContractId: contractActive3.id,
    });

    const contractActive2 = await Contract.create({
      id: 2,
      terms: 'bla bla bla',
      status: 'in_progress',
      ClientId: clientProfile1.id,
      ContractorId: contractorProfile2.id,
    });
    // job9 to account
    job9 = await Job.create({
      description: 'work',
      price: 230,
      paid: true,
      paymentDate: '2022-02-01T19:11:26.737Z',
      ContractId: contractActive2.id,
    });
    await Job.create({
      description: 'work',
      price: 300,
      ContractId: contractActive2.id,
    });
  });

  const userRoleTest = async (requestFn) => {
    const res = await requestFn(clientProfile1.id, {});
    expect(res.statusCode).toEqual(403);
  };

  const dateParamsTest = async (requestFn) => {
    let res = await requestFn(adminProfile.id, {});
    expect(res.statusCode).toEqual(401);

    res = await requestFn(adminProfile.id, { start: 1 });
    expect(res.statusCode).toEqual(401);

    res = await requestFn(adminProfile.id, { end: 1 });
    expect(res.statusCode).toEqual(401);

    res = await requestFn(adminProfile.id, { start: '2022-02-30', end: '2022-02-31' });
    expect(res.statusCode).toEqual(401);

    res = await requestFn(adminProfile.id, { start: '2022-02-01', end: '2022-01-01' });
    expect(res.statusCode).toEqual(401);

    res = await requestFn(adminProfile.id, { start: '2022-01-01', end: '2022-01-01' });
    expect(res.statusCode).toEqual(401);

    res = await requestFn(adminProfile.id, { start: '2022-01-01a', end: '2022-02-01' });
    expect(res.statusCode).toEqual(401);
  };

  describe('/admin/best-profession', () => {
    it('should return 403 if user is not admin', async () => {
      await userRoleTest(getBestProfessionRequest);
    });

    it('should return 401 if bad query params', async () => {
      await dateParamsTest(getBestProfessionRequest);
    });

    it('should return correct profession', async () => {
      let res = await getBestProfessionRequest(adminProfile.id, { start: '2022-01-01', end: '2022-01-02' });
      expect(res.statusCode).toEqual(200);
      // job1, job2
      expect(res.body).toEqual({ profession: 'Musician' });

      res = await getBestProfessionRequest(adminProfile.id, { start: '2022-01-01', end: '2022-01-03T19:12:00.000Z' });
      expect(res.statusCode).toEqual(200);
      // job1, job2, job3 > job6
      expect(res.body).toEqual({ profession: 'Musician' });

      res = await getBestProfessionRequest(adminProfile.id, { start: '2022-01-01', end: '2022-01-06' });
      expect(res.statusCode).toEqual(200);
      // job6, job7, job8
      expect(res.body).toEqual({ profession: 'Programmer' });

      res = await getBestProfessionRequest(adminProfile.id, { start: '2022-01-03', end: '2022-01-04' });
      expect(res.statusCode).toEqual(200);
      // job3(120) > job6(100)
      expect(res.body).toEqual({ profession: 'Musician' });

      res = await getBestProfessionRequest(adminProfile.id, { start: '2022-01-03', end: '2022-01-06' });
      expect(res.statusCode).toEqual(200);
      // job6, job7, job8 > job3
      expect(res.body).toEqual({ profession: 'Programmer' });

      res = await getBestProfessionRequest(adminProfile.id, { start: '2022-02-01', end: '2022-03-02' });
      expect(res.statusCode).toEqual(200);
      // job4(230) > job9(230)
      expect(res.body).toEqual({ profession: 'Musician' });

      res = await getBestProfessionRequest(adminProfile.id, { start: '2022-01-01', end: '2022-03-02' });
      expect(res.statusCode).toEqual(200);
      // job6, job7, job8, job9
      expect(res.body).toEqual({ profession: 'Programmer' });
    });
  });

  describe('/admin/best-clients', () => {
    it('should return 403 if user is not admin', async () => {
      await userRoleTest(getBestClientsRequest);
    });

    it('should return 401 if bad query params', async () => {
      await dateParamsTest(getBestClientsRequest);
    });

    it('should return correct clients', async () => {
      const client1Stub = {
        id: clientProfile1.id,
        fullName: `${clientProfile1.firstName} ${clientProfile1.lastName}`,
      };
      const client2Stub = {
        id: clientProfile2.id,
        fullName: `${clientProfile2.firstName} ${clientProfile2.lastName}`,
      };

      let res = await getBestClientsRequest(adminProfile.id, { start: '2022-01-01', end: '2022-01-02' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([Object.assign({}, client1Stub, { paid: job1.price + job2.price })]);

      res = await getBestClientsRequest(adminProfile.id, { start: '2022-01-01', end: '2022-01-03T19:12:00.000Z' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([
        Object.assign({}, client1Stub, { paid: job1.price + job2.price + job3.price }),
        Object.assign({}, client2Stub, { paid: job6.price }),
      ]);

      res = await getBestClientsRequest(adminProfile.id, { start: '2022-01-01', end: '2022-01-06' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([
        Object.assign({}, client2Stub, { paid: job6.price + job7.price + job8.price }),
        Object.assign({}, client1Stub, { paid: job1.price + job2.price + job3.price }),
      ]);

      res = await getBestClientsRequest(adminProfile.id, { start: '2022-01-03', end: '2022-01-04' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([Object.assign({}, client1Stub, { paid: job3.price }), Object.assign({}, client2Stub, { paid: job6.price })]);

      res = await getBestClientsRequest(adminProfile.id, { start: '2022-01-03', end: '2022-01-06' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([
        Object.assign({}, client2Stub, { paid: job6.price + job7.price + job8.price }),
        Object.assign({}, client1Stub, { paid: job3.price }),
      ]);

      res = await getBestClientsRequest(adminProfile.id, { start: '2022-02-01', end: '2022-03-02' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([Object.assign({}, client2Stub, { paid: job4.price }), Object.assign({}, client1Stub, { paid: job9.price })]);

      res = await getBestClientsRequest(adminProfile.id, { start: '2022-01-01', end: '2022-03-02' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([
        Object.assign({}, client2Stub, { paid: job6.price + job7.price + job8.price + job4.price }),
        Object.assign({}, client1Stub, { paid: job1.price + job2.price + job3.price + job9.price }),
      ]);
    });

    it('should check limit', async () => {
      let res = await getBestClientsRequest(adminProfile.id, { start: '2022-01-01', end: '2022-10-01' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);

      res = await getBestClientsRequest(adminProfile.id, { start: '2022-01-01', end: '2022-10-01', limit: 1 });
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(1);
    });
  });
});
