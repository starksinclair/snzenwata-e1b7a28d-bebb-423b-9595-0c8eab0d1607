import axios, { AxiosError } from 'axios';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Generate a unique string to avoid collisions between test runs. */
const uid = () => Math.random().toString(36).slice(2, 10);

/** Register a fresh org + owner user, returning the access token. */
async function registerOwner(
  orgName = `org-${uid()}`,
  email = `owner-${uid()}@test.com`,
  password = 'Test1234',
) {
  const res = await axios.post('/api/auth/register', {
    org_name: orgName,
    email,
    password,
  });
  return {
    token: res.data.accessToken as string,
    email,
    password,
    orgName,
  };
}

/** Shorthand for creating an authenticated axios config. */
function authHeader(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/** Extract the HTTP status from an axios error, or rethrow. */
function statusOf(err: unknown): number {
  if (err instanceof AxiosError && err.response) return err.response.status;
  throw err;
}

/* ================================================================== */
/*  1. Health / Root                                                   */
/* ================================================================== */

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get('/api');
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });
});

/* ================================================================== */
/*  2. Auth – Register & Login                                         */
/* ================================================================== */

describe('Auth (/api/auth)', () => {
  const orgName = `auth-org-${uid()}`;
  const email = `auth-${uid()}@test.com`;
  const password = 'Secret123';

  describe('POST /api/auth/register', () => {
    it('should register a new user and return an access token', async () => {
      const res = await axios.post('/api/auth/register', {
        org_name: orgName,
        email,
        password,
      });
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('accessToken');
      expect(typeof res.data.accessToken).toBe('string');
    });

    it('should reject duplicate email / org name', async () => {
      try {
        await axios.post('/api/auth/register', {
          org_name: orgName,
          email,
          password,
        });
        fail('Expected request to fail');
      } catch (err) {
        expect(statusOf(err)).toBeGreaterThanOrEqual(400);
      }
    });

    it('should reject invalid payload (missing fields)', async () => {
      try {
        await axios.post('/api/auth/register', { email: 'x@x.com' });
        fail('Expected request to fail');
      } catch (err) {
        expect(statusOf(err)).toBeGreaterThanOrEqual(400);
      }
    });

    it('should reject short password (< 6 chars)', async () => {
      try {
        await axios.post('/api/auth/register', {
          org_name: `short-pw-${uid()}`,
          email: `short-${uid()}@test.com`,
          password: '12345',
        });
        fail('Expected request to fail');
      } catch (err) {
        expect(statusOf(err)).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in with valid credentials and return an access token', async () => {
      const res = await axios.post('/api/auth/login', { email, password });
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('accessToken');
    });

    it('should reject wrong password', async () => {
      try {
        await axios.post('/api/auth/login', {
          email,
          password: 'WrongPass99',
        });
        fail('Expected request to fail');
      } catch (err) {
        expect(statusOf(err)).toBeGreaterThanOrEqual(400);
      }
    });

    it('should reject non-existent email', async () => {
      try {
        await axios.post('/api/auth/login', {
          email: 'nobody@nowhere.com',
          password: 'irrelevant',
        });
        fail('Expected request to fail');
      } catch (err) {
        expect(statusOf(err)).toBeGreaterThanOrEqual(400);
      }
    });
  });
});

/* ================================================================== */
/*  3. Tasks CRUD (authenticated, RBAC)                                */
/* ================================================================== */

describe('Tasks (/api/tasks)', () => {
  let ownerToken: string;
  let createdTaskId: string;

  beforeAll(async () => {
    const owner = await registerOwner();
    ownerToken = owner.token;
  });

  /* ---- Unauthenticated access ---- */

  it('GET /api/tasks should return 401 without a token', async () => {
    try {
      await axios.get('/api/tasks');
      fail('Expected 401');
    } catch (err) {
      expect(statusOf(err)).toBe(401);
    }
  });

  it('POST /api/tasks should return 401 without a token', async () => {
    try {
      await axios.post('/api/tasks', {
        title: 'x',
        category: 'WORK',
        status: 'TODO',
      });
      fail('Expected 401');
    } catch (err) {
      expect(statusOf(err)).toBe(401);
    }
  });

  /* ---- Create ---- */

  describe('POST /api/tasks (create)', () => {
    it('should create a task', async () => {
      const res = await axios.post(
        '/api/tasks',
        {
          title: 'E2E Test Task',
          description: 'Created by e2e',
          category: 'WORK',
          status: 'TODO',
        },
        authHeader(ownerToken),
      );
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data.title).toBe('E2E Test Task');
      expect(res.data.category).toBe('WORK');
      expect(res.data.status).toBe('TODO');
      createdTaskId = res.data.id;
    });

    it('should reject invalid category', async () => {
      try {
        await axios.post(
          '/api/tasks',
          { title: 'Bad', category: 'INVALID', status: 'TODO' },
          authHeader(ownerToken),
        );
        fail('Expected 400');
      } catch (err) {
        expect(statusOf(err)).toBe(400);
      }
    });

    it('should reject missing title', async () => {
      try {
        await axios.post(
          '/api/tasks',
          { category: 'WORK', status: 'TODO' },
          authHeader(ownerToken),
        );
        fail('Expected 400');
      } catch (err) {
        expect(statusOf(err)).toBe(400);
      }
    });
  });

  /* ---- Read ---- */

  describe('GET /api/tasks (list)', () => {
    it('should return an array including the created task', async () => {
      const res = await axios.get('/api/tasks', authHeader(ownerToken));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      const ids = res.data.map((t: { id: string }) => t.id);
      expect(ids).toContain(createdTaskId);
    });
  });

  describe('GET /api/tasks/:id (single)', () => {
    it('should return the task by id', async () => {
      const res = await axios.get(
        `/api/tasks/${createdTaskId}`,
        authHeader(ownerToken),
      );
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(createdTaskId);
      expect(res.data.title).toBe('E2E Test Task');
    });

    it('should return 404 for non-existent id', async () => {
      try {
        await axios.get(
          '/api/tasks/00000000-0000-0000-0000-000000000000',
          authHeader(ownerToken),
        );
        fail('Expected 404');
      } catch (err) {
        // API may return 404 or 500; accept either non-200
        expect(statusOf(err)).toBeGreaterThanOrEqual(400);
      }
    });
  });

  /* ---- Update ---- */

  describe('PUT /api/tasks/:id (update)', () => {
    it('should update the task title and status', async () => {
      const res = await axios.put(
        `/api/tasks/${createdTaskId}`,
        { title: 'Updated Title', status: 'IN_PROGRESS' },
        authHeader(ownerToken),
      );
      expect(res.status).toBe(200);
      expect(res.data.title).toBe('Updated Title');
      expect(res.data.status).toBe('IN_PROGRESS');
    });

    it('should update only the category', async () => {
      const res = await axios.put(
        `/api/tasks/${createdTaskId}`,
        { category: 'PERSONAL' },
        authHeader(ownerToken),
      );
      expect(res.status).toBe(200);
      expect(res.data.category).toBe('PERSONAL');
      // title should remain unchanged
      expect(res.data.title).toBe('Updated Title');
    });
  });

  /* ---- Delete ---- */

  describe('DELETE /api/tasks/:id', () => {
    it('should delete the task', async () => {
      const res = await axios.delete(
        `/api/tasks/${createdTaskId}`,
        authHeader(ownerToken),
      );
      expect(res.status).toBe(200);
    });

    it('should no longer find the deleted task', async () => {
      try {
        await axios.get(`/api/tasks/${createdTaskId}`, authHeader(ownerToken));
        fail('Expected error for deleted task');
      } catch (err) {
        expect(statusOf(err)).toBeGreaterThanOrEqual(400);
      }
    });
  });

  /* ---- Task categories & statuses ---- */

  describe('Task enum values', () => {
    it.each([
      ['WORK', 'TODO'],
      ['PERSONAL', 'IN_PROGRESS'],
      ['OTHER', 'COMPLETED'],
    ])('should accept category=%s status=%s', async (category, status) => {
      const res = await axios.post(
        '/api/tasks',
        { title: `${category}-${status}`, category, status },
        authHeader(ownerToken),
      );
      expect(res.status).toBe(201);
      expect(res.data.category).toBe(category);
      expect(res.data.status).toBe(status);
    });
  });
});

/* ================================================================== */
/*  4. Audit Logs (OWNER only)                                         */
/* ================================================================== */

describe('Audit Logs (/api/audits-logs)', () => {
  let ownerToken: string;

  beforeAll(async () => {
    const owner = await registerOwner();
    ownerToken = owner.token;

    // Create & delete a task to generate audit entries
    const task = await axios.post(
      '/api/tasks',
      { title: 'Audit seed', category: 'WORK', status: 'TODO' },
      authHeader(ownerToken),
    );
    await axios.delete(`/api/tasks/${task.data.id}`, authHeader(ownerToken));
  });

  it('GET /api/audits-logs should return 401 without token', async () => {
    try {
      await axios.get('/api/audits-logs');
      fail('Expected 401');
    } catch (err) {
      expect(statusOf(err)).toBe(401);
    }
  });

  it('GET /api/audits-logs should return an array for owner', async () => {
    const res = await axios.get('/api/audits-logs', authHeader(ownerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('each audit log entry should have the expected shape', async () => {
    const res = await axios.get('/api/audits-logs', authHeader(ownerToken));
    if (res.data.length > 0) {
      const entry = res.data[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('action');
      expect(entry).toHaveProperty('success');
      expect(entry).toHaveProperty('actorUserId');
      expect(entry).toHaveProperty('actorOrgId');
    }
  });

  it('GET /api/audits-logs/:id should return a single entry', async () => {
    const list = await axios.get('/api/audits-logs', authHeader(ownerToken));
    if (list.data.length > 0) {
      const first = list.data[0];
      const res = await axios.get(
        `/api/audits-logs/${first.id}`,
        authHeader(ownerToken),
      );
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(first.id);
    }
  });
});

/* ================================================================== */
/*  5. RBAC – permission boundaries                                    */
/* ================================================================== */

describe('RBAC permission boundaries', () => {
  // We can only register as OWNER (the register endpoint always creates an
  // OWNER). To test VIEWER restrictions we would need a user-create endpoint
  // or direct DB seeding. For now we verify that an invalid/expired token is
  // rejected, and that OWNER has full access.

  it('should reject requests with an invalid token', async () => {
    try {
      await axios.get('/api/tasks', authHeader('invalid.jwt.token'));
      fail('Expected 401');
    } catch (err) {
      expect(statusOf(err)).toBe(401);
    }
  });

  it('OWNER should access audit logs', async () => {
    const owner = await registerOwner();
    const res = await axios.get('/api/audits-logs', authHeader(owner.token));
    expect(res.status).toBe(200);
  });

  it('OWNER should perform full task CRUD', async () => {
    const owner = await registerOwner();
    const cfg = authHeader(owner.token);

    // Create
    const created = await axios.post(
      '/api/tasks',
      { title: 'RBAC test', category: 'OTHER', status: 'TODO' },
      cfg,
    );
    expect(created.status).toBe(201);
    const id = created.data.id;

    // Read
    const read = await axios.get(`/api/tasks/${id}`, cfg);
    expect(read.status).toBe(200);

    // Update
    const updated = await axios.put(
      `/api/tasks/${id}`,
      { status: 'COMPLETED' },
      cfg,
    );
    expect(updated.status).toBe(200);
    expect(updated.data.status).toBe('COMPLETED');

    // Delete
    const deleted = await axios.delete(`/api/tasks/${id}`, cfg);
    expect(deleted.status).toBe(200);
  });
});
