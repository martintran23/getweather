# Weather App — Fullstack Setup

This project consists of a **Flask backend** API and a **Next.js frontend** deployed locally and separately. The backend handles weather data storage and retrieval, while the frontend interacts with users. The app uses cloud-based storage via MongoDB Atlas for storing weather data.

---

## Setup Instructions

### 1. Clone Repository
Clone the Github repository, and access the weather-app directory.

```bash
git clone https://github.com/martintran23/getweather.git
cd getweather
```

### 2. Install Node.js
Install Node.js and check the box allowing it to make changes.
https://nodejs.org/

### 3. Install Dependencies
Install the requirements.txt from the root directory. Then navigate to the backend directory and install the requirements from the requirements.txt. Activate the virtual environment, then navigate to the frontend directory, app, and install Node Package Manager (npm).

```bash
pip install -r requirements.txt

cd backend
pip install -r requirements.txt

python -m venv venv
# If unable to activate virtual environment
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# macOS/Linux
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\activate

cd ../app
npm install
```


###  4. Run App Locally
In one terminal, in the backend directory, run the command "python app.py" to deploy the backend on Flask. Then in another terminal, in the frontend directory, run the command "npm run dev" to deploy the front end on Next.js.

```bash
python app.py

npm run dev
```

### 5. Access App
Open "http://localhost:3000" on a browser to access the application.