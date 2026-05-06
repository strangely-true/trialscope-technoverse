from db.database import SessionLocal
from models.models import User, PatientQuestionnaire, Trial
from sqlalchemy import func, or_

db = SessionLocal()
q = db.query(PatientQuestionnaire).filter(PatientQuestionnaire.patient_id == 2).first()
if q:
    condition = (q.primary_condition or "").lower()
    keywords = [word for word in condition.split() if len(word) > 3]
    query = db.query(Trial).filter(Trial.status == "active")
    print("Active:", query.count())
    keyword_filters = []
    for kw in keywords:
        keyword_filters.append(func.lower(Trial.disease).contains(kw))
        keyword_filters.append(func.lower(Trial.title).contains(kw))
    query = query.filter(or_(*keyword_filters))
    print("After keywords:", query.count())
    
    age = int(q.age)
    query = query.filter(Trial.age_min <= age, Trial.age_max >= age)
    print("After age:", query.count())
    
    query = query.filter(or_(Trial.gender == q.gender, Trial.gender == "any"))
    print("After gender:", query.count())
