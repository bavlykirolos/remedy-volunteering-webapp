# HCAD
- Created by Leo Cai (leocai2004@gmail.com), Muzaffar Hasan Collak (mh.colak@outlook.com) and Bavly Kirolos (me :) ) as part of our HCAD cource in Technische Universität München
- check out remedyy.vercel.app​
# Set up
- navigate to HCAD/backend
- On Linux/MacOS:
    - give permission to the setup script by running "chmod +x path/to/setup.sh"
    - execute setup.sh
- On Windows:
    - execute setup.ps1 in shell
    - if it doesn't work: run "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass" and try again
# Starting Site
- in shell run .\venv\Scripts\Activate.ps1
    - if doesn't work same fix as before
- set environmental variable for mongodb using "
- once in venv run python app.py
    - might have to install flask "pip install flask flask-cors"

- in seperate terminal navigate to frontend
- if first time run "npm install"
- run "npm start"
- website should open automatically on http://localhost:3000/
