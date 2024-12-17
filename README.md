# STREAMiFY Backend

STREAMiFY is the backend service for a video streaming platform. It is designed to handle user data, video uploads, streaming functionality, and related operations. This backend is built using modern technologies and frameworks, ensuring scalability and reliability.

## Features

- **User Management**: Secure authentication and authorization for users.
- **Video Upload and Storage**: Supports video uploads with file handling using Multer and storage with Cloudinary.
- **Streaming Services**: Efficient video streaming for optimal performance.
- **Database Integration**: MongoDB and Mongoose for robust and scalable data management.
- **Error Handling**: Comprehensive error handling for a smooth user experience.

## Tech Stack

- **Node.js**: JavaScript runtime environment.
- **Express.js**: Framework for building RESTful APIs.
- **MongoDB**: NoSQL database for storing user and video data.
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB.
- **Cloudinary**: Cloud-based service for video storage and streaming.
- **Multer**: Middleware for handling `multipart/form-data` for file uploads.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/SinghVivek1107/STREAMiFY.git
   cd STREAMiFY
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory and configure the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Run the Application**:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000` by default.


## Future Enhancements

- Implement real-time chat and comments.
- Add analytics for video performance.
- Integrate advanced search functionality.
- Optimize for large-scale deployment.


## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

For questions or support, please contact:
- **Name**: Vivek Singh
- **Email**: viveksinghvs1107@gmail.com
- **GitHub**: [SinghVivek1107](https://github.com/SinghVivek1107)

