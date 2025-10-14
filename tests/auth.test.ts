import request from 'supertest';
import app from '../src/app';
import { createUser, loginUser } from '../src/services/auth.service';

jest.mock('../src/services/auth.service');

describe('Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = { email: 'test@example.com', password: 'Password123' };
      (createUser as jest.Mock).mockResolvedValueOnce({ id: 1, ...userData });

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ id: 1, email: userData.email });
      expect(createUser).toHaveBeenCalledWith(userData);
    });

    it('should return 400 if user already exists', async () => {
      const userData = { email: 'test@example.com', password: 'Password123' };
      (createUser as jest.Mock).mockRejectedValueOnce(new Error('User already exists'));

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'User already exists' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in a user successfully', async () => {
      const userData = { email: 'test@example.com', password: 'Password123' };
      (loginUser as jest.Mock).mockResolvedValueOnce({ token: 'fake-jwt-token' });

      const response = await request(app).post('/api/auth/login').send(userData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ token: 'fake-jwt-token' });
      expect(loginUser).toHaveBeenCalledWith(userData);
    });

    it('should return 401 if credentials are invalid', async () => {
      const userData = { email: 'test@example.com', password: 'WrongPassword' };
      (loginUser as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

      const response = await request(app).post('/api/auth/login').send(userData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });
  });
});