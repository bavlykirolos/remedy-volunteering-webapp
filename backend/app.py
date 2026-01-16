from flask import Flask, request, session, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId, SON
import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
app.secret_key = "johnpork"
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True
)
CORS(
    app,
    supports_credentials=True,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:3000",           
                 r"https://.*\.vercel\.app"
            ]
        }
    }
)
MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise RuntimeError("MONGODB_URL nicht gesetzt!")

client = MongoClient(MONGODB_URL)
db = client.hcad                  
users_coll = db.users  

requests_coll = db.requests
posts_coll = db.posts
events_coll = db.events


@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        
        return ("", 200)
    data = request.get_json()
    required = ("username","password","first_name","last_name","age","gender")
    if not all(k in data and data[k] for k in required):
        return jsonify({"message": "Alle Felder sind erforderlich."}), 400

    if users_coll.find_one({"username": data["username"]}):
        return jsonify({"message": "Username existiert bereits."}), 400

    new_user = {
        "username":    data["username"],
        "password":    data["password"],
        "first_name":  data["first_name"],
        "last_name":   data["last_name"],
        "age":         int(data["age"]),
        "gender":      data["gender"]
    }
    users_coll.insert_one(new_user)
    return jsonify({"message": "Account erfolgreich erstellt."}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username und Passwort erforderlich"}), 400

    user_doc = users_coll.find_one({"username": username})
    if user_doc and user_doc.get("password") == password:
        session["user"] = username
        return jsonify({"message": "Login erfolgreich", "user": username}), 200
    else:
        return jsonify({"message": "Ungültige Anmeldedaten"}), 401
    
@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"message": "Abgemeldet"}), 200

@app.route("/check-login", methods=["GET"])
def check_login():
    if "user" in session:
        return jsonify({"logged_in": True, "user": session["user"]}), 200
    else:
        return jsonify({"logged_in": False}), 200
    
@app.route("/user", methods=["GET", "PUT", "OPTIONS"])
def user_profile():
    if request.method == "OPTIONS":
        return ("", 200)

    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401

    username = session["user"]

    if request.method == "GET":
        user_doc = users_coll.find_one({"username": username}, {"_id": 0, "password": 0})
       
        if user_doc:
            return jsonify(user_doc), 200
        else:
            return jsonify({"message": "User nicht gefunden"}), 404

    if request.method == "PUT":
        data = request.get_json()
        
        update_fields = {}
        if "password" in data and data["password"]:
            update_fields["password"] = data["password"]
    
        if "email" in data:
            update_fields["email"] = data["email"]

        if "first_name" in data:
            update_fields["first_name"] = data["first_name"]
        if "last_name" in data:
            update_fields["last_name"] = data["last_name"]
        
        if "age" in data and data["age"] != "":
            try:
                update_fields["age"] = int(data["age"])
            except ValueError:
                return jsonify({"message": "Alter muss eine Zahl sein"}), 400
        if "gender" in data:
            update_fields["gender"] = data["gender"]

        if not update_fields:
            return jsonify({"message": "Keine Felder zum Aktualisieren übergeben"}), 400

        result = users_coll.update_one(
            {"username": username},
            {"$set": update_fields}
        )
        if result.matched_count == 1:
            return jsonify({"message": "Profil aktualisiert"}), 200
        else:
            return jsonify({"message": "Update fehlgeschlagen"}), 500
    return jsonify({"message": "Methode nicht erlaubt"}), 405

@app.route("/posts", methods=["GET", "OPTIONS"])
def get_posts():
    if request.method == "OPTIONS":
        return ("", 200)
    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401

    cursor = posts_coll.find({}, {"_id": 0}).sort("timestamp", -1)
    posts = list(cursor)
    return jsonify(posts), 200

@app.route("/posts", methods=["POST", "OPTIONS"])
def create_post():
    if request.method == "OPTIONS":
        return ("", 200)
    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401

    data = request.get_json()
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"message": "Beitrag darf nicht leer sein"}), 400

    post_doc = {
        "username": session["user"],
        "content": content,
        "timestamp": datetime.utcnow()
    }
    posts_coll.insert_one(post_doc)
    return jsonify({"message": "Beitrag erstellt"}), 200

@app.route("/requests", methods=["GET", "OPTIONS"])
def get_requests():
    if request.method == "OPTIONS":
        return ("", 200)

    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401

    # Alle Dokumente abrufen, _id in String umwandeln, inkl. Feld "answers"
    cursor = requests_coll.find({}, {"__v": 0}).sort("timestamp", -1)
    all_reqs = []
    for doc in cursor:
        # doc ist ein Python‐Dict mit "_id" als ObjectId – wandeln wir um:
        req = {
            "id": str(doc["_id"]),           # String-Version der ID
            "username": doc["username"],
            "anliegen": doc["anliegen"],
            "street":    doc.get("street", ""),
            "postcode":  doc.get("postcode", ""),
            "city":      doc.get("city", ""),
            "telefon": doc["telefon"],
            "name": doc["name"],
            "datumzeit": doc["datumzeit"],   # ISO-String vom Frontend
            "beschreibung": doc["beschreibung"],
            "timestamp": doc["timestamp"].isoformat(),  # für Klarheit
            "answers": []
        }
        # Antworten (falls vorhanden) hinzufügen, auch _id nicht erforderlich
        if "answers" in doc and isinstance(doc["answers"], list):
            for ans in doc["answers"]:
                req["answers"].append({
                    "username": ans.get("username"),
                    "content": ans.get("content"),
                    "timestamp": ans.get("timestamp").isoformat()
                })
        all_reqs.append(req)
    return jsonify(all_reqs), 200

@app.route("/requests", methods=["POST", "OPTIONS"])
def create_request():
    if request.method == "OPTIONS":
        return ("", 200)

    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401

    data = request.get_json()

    # Felder aus JSON extrahieren
    anliegen    = data.get("anliegen", "").strip()
    street   = data.get("street", "").strip()
    postcode = data.get("postcode", "").strip()
    city     = data.get("city", "").strip()
    telefon     = data.get("telefon", "").strip()
    name        = data.get("name", "").strip()
    datumzeit   = data.get("datumzeit", "").strip()  # ISO‐String vom Frontend
    beschreibung = data.get("beschreibung", "").strip()

    # Validierung: alle Felder müssen zumindest nicht leer sein
    if not (anliegen and street and postcode and city and telefon and name and datumzeit and beschreibung):
        return jsonify({"message": "Bitte fülle alle Felder aus"}), 400

    # Neuen Request in MongoDB speichern
    req_doc = {
        "username": session["user"],
        "anliegen": anliegen,
        "street":   street,
        "postcode": postcode,
        "city":     city,
        "telefon":  telefon,
        "name":     name,
        "datumzeit": datumzeit,
        "beschreibung": beschreibung,
        "timestamp": datetime.utcnow(),
        "answers": []
    }
    result = requests_coll.insert_one(req_doc)
    return jsonify({
        "message": "Anfrage erfolgreich erstellt",
        "id": str(result.inserted_id)  # Geben wir direkt die neue ID zurück
    }), 200

@app.route("/requests/<string:req_id>/answers", methods=["POST", "OPTIONS"])
def add_answer(req_id):
    if request.method == "OPTIONS":
        return ("", 200)

    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401

    data = request.get_json()
    content = data.get("content", "").strip()
    if not content:
        return jsonify({"message": "Antwort darf nicht leer sein"}), 400

    try:
        obj_id = ObjectId(req_id)
    except:
        return jsonify({"message": "Ungültige Anfrage‐ID"}), 400

    answer_doc = {
        "username": session["user"],
        "content": content,
        "timestamp": datetime.utcnow()
    }
    result = requests_coll.update_one(
        {"_id": obj_id},
        {"$push": {"answers": answer_doc}}
    )
    if result.matched_count != 1:
        return jsonify({"message": "Anfrage nicht gefunden"}), 404

    return jsonify({"message": "Antwort erfolgreich hinzugefügt"}), 200

@app.route("/calendar", methods=["GET", "OPTIONS"])
def get_events():
    if request.method == "OPTIONS":
        return("", 200)
    
    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401
    
    username = session["user"]
    cursor = events_coll.find({"username": username}, {"_id": 0})
    events = list(cursor)
    return jsonify(events), 200

@app.route("/calendar", methods=["POST", "OPTIONS"])
def create_event():
    if request.method == "OPTIONS":
        return ("", 200)
    
    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401
    
    data = request.get_json()
    title = data.get("title", "").strip()
    start = data.get("start", "").strip()
    end = data.get("end", "").strip()
    recurring = data.get("recurring", False)
    recurring_type = data.get("recurring_type", "none")  # daily, weekly, monthly, yearly
    
    if not title or not start:
        return jsonify({"message": "Titel und Startzeit erforderlich"}), 400
    
    event_doc = {
        "id": str(ObjectId()),  # Generate unique ID for frontend
        "username": session["user"],
        "title": title,
        "start": start,
        "end": end if end else start,
        "recurring": recurring,
        "recurring_type": recurring_type,
        "created_at": datetime.utcnow()
    }
    
    events_coll.insert_one(event_doc)
    return jsonify({"message": "Termin erfolgreich erstellt"}), 200

@app.route("/calendar/<string:event_id>", methods=["DELETE", "OPTIONS"])
def delete_event(event_id):
    if request.method == "OPTIONS":
        return ("", 200)
    
    if "user" not in session:
        return jsonify({"message": "Nicht angemeldet"}), 401
    
    result = events_coll.delete_one({
        "id": event_id,
        "username": session["user"]
    })
    
    if result.deleted_count == 1:
        return jsonify({"message": "Termin gelöscht"}), 200
    else:
        return jsonify({"message": "Termin nicht gefunden"}), 404

if __name__ == "__main__":
    app.run(debug=True)