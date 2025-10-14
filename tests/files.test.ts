import request from 'supertest';
import app from '../src/app'; // Adjust the path as necessary
import { createUser, deleteUser } from './utils/testUtils'; // Utility functions for test setup

describe('File Uploads', () => {
  let userToken: string;

  beforeAll(async () => {
    // Create a test user and get the token
    const user = await createUser();
    userToken = user.token;
  });

  afterAll(async () => {
    // Clean up test user
    await deleteUser(userToken);
  });

  it('should upload a file successfully', async () => {
    const filePath = 'path/to/test/file.txt'; // Adjust the path to your test file
    const response = await request(app)
      .post('/api/files/upload') // Adjust the endpoint as necessary
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', filePath);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url'); // Assuming the response contains the file URL
  });

  it('should return an error for invalid file type', async () => {
    const invalidFilePath = 'path/to/test/invalid_file.exe'; // Adjust the path to your invalid test file
    const response = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', invalidFilePath);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid file type'); // Adjust the error message as necessary
  });

  it('should return an error if no file is provided', async () => {
    const response = await request(app)
      .post('/api/files/upload')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'No file uploaded'); // Adjust the error message as necessary
  });
});