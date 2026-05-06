from db.database import SessionLocal
from models.models import User, PatientQuestionnaire, Trial
from sqlalchemy import func

db = SessionLocal()
current_user = db.query(User).filter(User.id == 2).first()
if current_user:
    print(f"User: {current_user.email}, Role: {current_user.role}")
    q = db.query(PatientQuestionnaire).filter(PatientQuestionnaire.patient_id == current_user.id).first()
    if q:
        print(f"Q: primary_condition='{q.primary_condition}', age={q.age}, gender='{q.gender}'")
        condition = (q.primary_condition or "").lower()
        query = db.query(Trial).filter(Trial.status == "active")
        print("All trials count:", query.count())
        query = query.filter(func.lower(Trial.disease).contains(condition))
        print("Filtered by condition count:", query.count())
    else:
        print("No questionnaire")
else:
    print("User 2 not found")
