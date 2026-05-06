import requests
import time
import json
import traceback
import os
from datetime import datetime
from sqlalchemy import text
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

REPORT_PATH = "./reports/e2e_report.md"
os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

BASE = "http://localhost:8000"

def safe_post(path, json_data=None, files=None, headers=None):
    try:
        r = requests.post(BASE + path, json=json_data, files=files, headers=headers, timeout=30)
        return r.status_code, r.text, r
    except Exception as e:
        return None, str(e), None

def safe_get(path, headers=None):
    try:
        r = requests.get(BASE + path, headers=headers, timeout=30)
        return r.status_code, r.text, r
    except Exception as e:
        return None, str(e), None

def count_table(sess, table):
    try:
        sess.rollback()
        res = sess.execute(text(f"SELECT count(*) FROM {table}"))
        return int(res.scalar() or 0)
    except Exception as e:
        return f"ERR: {e}"

def main():
    results = []
    try:
        import sqlalchemy
        from db.database import SessionLocal
        sess = SessionLocal()
    except Exception as e:
        sess = None
        results.append(("DB", "FAIL", f"Cannot create DB session: {e}"))

    # STEP 2 — AUTH
    try:
        email = f"e2e_pharma_{int(time.time())}@example.com"
        reg_payload = {"email": email, "password": "Password123!", "role": "pharma", "full_name": "E2E Pharma"}
        code, text, resp = safe_post("/auth/register", json_data=reg_payload)
        results.append(("POST /auth/register", code, text))

        code, text, resp = safe_post("/auth/login", json_data={"email": email, "password": "Password123!"})
        token = None
        if resp is not None and resp.ok:
            try:
                token = resp.json().get("access_token") or resp.json().get("token")
            except Exception:
                token = None
        results.append(("POST /auth/login", code, text))

        headers = {"Authorization": f"Bearer {token}"} if token else None
        code, text, resp = safe_get("/auth/me", headers=headers)
        results.append(("GET /auth/me", code, text))
    except Exception as e:
        results.append(("AUTH", "ERR", traceback.format_exc()))

    # STEP 3 — TRIAL CREATION + AGENT CHAIN
    try:
        trial_payload = {"title": "Blood Cancer Study", "disease": "blood cancer", "stage": "2", "patients_needed": 5}
        code, text, resp = safe_post("/trials/create", json_data=trial_payload, headers=headers)
        results.append(("POST /trials/create", code, text))
        trial_id = None
        try:
            if resp is not None and resp.ok:
                trial_id = resp.json().get("id")
        except Exception:
            trial_id = None
        # give agents some time to run
        if sess:
            import sqlalchemy
            for _ in range(15):
                sess.rollback()
                if int(sess.execute(sqlalchemy.text("SELECT count(*) FROM matched_candidates")).scalar() or 0) > 0:
                    break
                time.sleep(2)

        if sess:
            results.append(("social_raw_posts", count_table(sess, "social_raw_posts")))
            results.append(("extracted_candidates", count_table(sess, "extracted_candidates")))
            results.append(("fraud_flags", count_table(sess, "fraud_flags")))
            results.append(("matched_candidates", count_table(sess, "matched_candidates")))
    except Exception:
        results.append(("TRIAL_CREATE", "ERR", traceback.format_exc()))

    # STEP 4 — CONSENT FLOW
    try:
        # choose a candidate id if present
        candidate_id = None
        cand_trial_id = trial_id
        if sess:
            sess.rollback() # Refresh session
            try:
                import sqlalchemy
                r = sess.execute(sqlalchemy.text("SELECT candidate_id, trial_id FROM matched_candidates LIMIT 1")).first()
                if r:
                    candidate_id = r[0]
                    cand_trial_id = r[1]
            except Exception:
                pass

        if candidate_id:
            code, text_resp, resp = safe_post("/consent/respond", json_data={"candidate_id": candidate_id, "trial_id": cand_trial_id, "response": "YES"})
            results.append(("POST /consent/respond", code, text_resp))
        else:
            results.append(("POST /consent/respond", "SKIP", "No candidate available"))

        # upload consent PDF (include trial_id as query param if available)
        pdf_bytes = b"%PDF-1.4\n%EOF\n"
        files = {"file": ("consent.pdf", pdf_bytes, "application/pdf")}
        upload_path = "/consent/upload" + (f"?trial_id={trial_id}" if trial_id else "")
        code, text, resp = safe_post(upload_path, files=files, headers=headers)
        results.append(("POST /consent/upload", code, text))

        # fetch consent summary using corrected path
        summary_path = "/consent/summary/" + str(trial_id) if trial_id else "/consent/summary"
        code, text, resp = safe_get(summary_path, headers=headers)
        results.append(("GET /consent/summary", code, text))
    except Exception:
        results.append(("CONSENT_FLOW", "ERR", traceback.format_exc()))

    # STEP 5 — PATIENT HISTORY + FHIR
    try:
        # build history payload
        hist = {
            "candidate_id": candidate_id or 1,
            "full_name": "Test Patient",
            "age": 50,
            "gender": "Male",
            "city": "Testville",
            "country": "Testland",
            "diagnosed_conditions": ["C91 - Leukemia"],
            "symptom_description": "Fatigue and bruising",
            "duration": "3 months",
        }
        code, text, resp = safe_post("/patient/history/submit", json_data=hist, headers=headers)
        results.append(("POST /patient/history/submit", code, text))
        # capture created patient hash if available for wearable test
        created_patient_hash = None
        try:
            if resp is not None and resp.ok:
                created_patient_hash = resp.json().get("hash_id")
        except Exception:
            created_patient_hash = None
        time.sleep(2)
        if sess:
            results.append(("verified_patients", count_table(sess, "verified_patients")))
            results.append(("fhir_bundles_s3_refs", count_table(sess, "verified_patients")))
    except Exception:
        results.append(("HISTORY", "ERR", traceback.format_exc()))

    # STEP 6 — MONITORING AGENTS
    try:
        # Try to trigger dropout agent directly if available
        try:
            from agents.agent7_dropout import run_dropout_prediction
            if sess:
                res = run_dropout_prediction(sess)
                results.append(("Agent7_direct", "OK", str(res)))
        except Exception as e:
            results.append(("Agent7_direct", "ERR", str(e)))

        # wearable upload — use patient_hash_id and trial_id
        patient_hash = None
        trial_for_patient = trial_id
        if sess:
            sess.rollback()
            try:
                import sqlalchemy
                r = sess.execute(sqlalchemy.text("SELECT hash_id, trial_id FROM verified_patients LIMIT 1")).first()
                if r:
                    patient_hash = r[0]
                    trial_for_patient = r[1]
            except Exception:
                pass

        wearable = {"patient_hash_id": created_patient_hash or patient_hash or f"hash_dummy_{int(time.time())}", "trial_id": trial_for_patient or 1, "heart_rate": 160}
        code, text, resp = safe_post("/patient/wearable-upload", json_data=wearable, headers=headers)
        results.append(("POST /patient/wearable-upload", code, text))
        time.sleep(2)
        if sess:
            results.append(("anomaly_alerts", count_table(sess, "anomaly_alerts")))
    except Exception:
        results.append(("MONITORING", "ERR", traceback.format_exc()))

    # STEP 7 — DASHBOARDS (DB checks)
    try:
        if sess:
            results.append(("dropout_scores", count_table(sess, "dropout_scores")))
            results.append(("verified_patients_list", count_table(sess, "verified_patients")))
            results.append(("matched_candidates_list", count_table(sess, "matched_candidates")))
    except Exception:
        results.append(("DASHBOARDS", "ERR", traceback.format_exc()))

    # Write report
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(f"# TrialGo E2E Report\n\nGenerated: {datetime.utcnow().isoformat()}Z\n\n")
        for item in results:
            f.write(f"- {item[0]}: {item[1]}\n\n")
            if len(item) > 2:
                try:
                    f.write("  - details: ```\n" + (item[2] if isinstance(item[2], str) else json.dumps(item[2])) + "\n```\n\n")
                except Exception:
                    f.write(f"  - details: {repr(item[2])}\n\n")

    if sess:
        sess.close()

    print("E2E report written to:", REPORT_PATH)

if __name__ == '__main__':
    main()
