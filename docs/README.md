# Project Documentation

## Overview

This project is a Node.js application built with Express and Supabase, designed to provide a robust API for user authentication, file management, and mobile app functionalities. It adheres to industry standards for code quality, error handling, security, and scalability.

## Features

- User registration and login with JWT authentication
- Admin functionalities for managing users and content
- Mobile app API endpoints for seamless integration
- File uploads and management using Supabase storage
- Environment variable management for sensitive information
- Comprehensive error handling and logging

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)
- Supabase account and project
- PostgreSQL database (managed by Supabase)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd express-supabase-api
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` file and fill in your Supabase credentials and other environment variables.

4. Run the application:

   ```
   npm run dev
   ```

### API Documentation

The API endpoints are documented using OpenAPI specifications. You can find the documentation in the `docs/openapi.yaml` file.

### File Uploads

File uploads are handled through Supabase storage. Ensure that your Supabase storage bucket is configured correctly to allow file uploads.

## Testing

Unit tests are included in the `tests` directory. You can run the tests using:

```
npm test
```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.