const sanitize = require('../src/middleware/sanitize.middleware');
const authorize = require('../src/middleware/role.middleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('NoSQL sanitiser', () => {
  test('removes $ operators and dotted keys, including nested ones', () => {
    const req = { body: { email: { $gt: '' }, 'a.b': 1, nested: { $where: 'x', ok: 2 }, name: 'Ann' } };
    const next = jest.fn();
    sanitize(req, {}, next);
    expect(req.body).toEqual({ email: {}, nested: { ok: 2 }, name: 'Ann' });
    expect(next).toHaveBeenCalled();
  });
});

describe('role authorisation', () => {
  test('allows a listed role', () => {
    const next = jest.fn();
    authorize('freelancer')({ user: { id: '1', role: 'freelancer' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('blocks other roles with 403', () => {
    const res = mockRes();
    const next = jest.fn();
    authorize('freelancer')({ user: { id: '1', role: 'client' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('blocks requests with no user', () => {
    const res = mockRes();
    authorize('client')({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
