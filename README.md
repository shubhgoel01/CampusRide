CampusRide
A smart campus cycle booking app that lets students borrow and return cycles easily within the campus.

## Table Of Contents : 
- About the project.
- Tech Stack
- Features
- Setup Instructions
- Testing Credentials
- Author
    
## About The Project
This project solves the problem of large travelling time and aims to improve the mobility inside a large college campus.  
Students can book instant cycles in real-time, estimate travel time using Google Maps APIs, and manage bookings seamlessly through a web app.  
Admins can manage cycles and penalties efficiently from the dashboard.

## Tech Stack
**Backend:** Node.js, Express.js  
**Database:** MongoDB  
**APIs:** Google Distance Matrix, Stripe (for penalties)
**Authentication:** JWT, bcrypt  

## Features
- User authentication (JWT + bcrypt)
- Instant cycle availability
- Booking creation and end-trip logic
- Penalty calculation for late returns
- Admin cycle management
- Guard verification for cycle physical return
- Google Maps distance & time estimation
- Stripe integration for penalty payments

## Setup Instructions
1. Clone the repository:

   - git clone https://github.com/shubhgoel01/CampusRide.git
   - Open folder
   - npm install

2. Project Setup: 

    - Create a .env file in
        - backend folder and add environment variables
            - CORS_ORIGIN=*
            - REFRESH_TOKEN_SECRET
            - ACCESS_TOKEN_SECRET
            - REFRESH_TOKEN_EXPIRY=7d
            - ACCESS_TOKEN_EXPIRY=3d
            - DB_URL
            - STRIPE_SECRET_KEY
            - GOOGLEMAPS_API_KEY  

        - frontend folder and add environment variables
            -   VITE_STRIPE_PUBLISHABLE_KEY

3. Run Project

    - Start backend
        - cd backend 
        - npm start
    - Start Frontend
        - cd frontend
        - npm start
    
## Testing Credentials

**Admin Credentials**
    - Email: test3@gmail.com
    - Password: 12345678
    

**Guard Credentials**
    - Email: test4@gmail.com
    - Password: 12345678

**Student(User) Credentials**
    - Email: test2@gmail.com
    - Password: 12345678

## Author
**Shubh Goel**  
MCA Student | Android & Web Developer  
[LinkedIn](https://www.linkedin.com/in/shubh-goel-383763295/) | [GitHub](https://github.com/shubhgoel01)
