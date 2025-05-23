# Weather App — Fullstack Setup

### This project consists of a **Flask backend** API and a **Next.js frontend** deployed locally and separately. The backend handles weather data storage and retrieval, while the frontend interacts with users. The app uses cloud-based storage via MongoDB Atlas for storing weather data.
---

## Setup Instructions

### 1. Clone Repository
Clone the Github repository, and access the weather-app directory.

```bash
git clone https://github.com/martintran23/getweather.git
cd weather-app
```

### 2. Install Dependencies
Navigate to the backend and install the requirements from the requirements.txt. Activate the virtual environment, then navigate to the frontend and install Node Package Manager (npm).

```bash
cd backend
pip install -r requirements.txt
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\activate

cd ../frontend
npm install
```


###  3. Run App Locally
In one terminal, in the backend directory, run the command "python app.py" to deploy the backend on Flask. Then in another terminal, in the frontend directory, run the command "npm run dev" to deploy the front end on Next.js.

```bash
python app.py

npm run dev
```

### 4. Access App
Open "http://localhost:3000" on a browser to access the application.