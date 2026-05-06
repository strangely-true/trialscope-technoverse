import sys, requests, time
sys.path.insert(0, '/app')

res = requests.post('http://localhost:8000/auth/login', json={'email': 'testpatient@trialgo.com', 'password': 'Patient@123'})
if res.status_code != 200:
    print('Login fail:', res.text); sys.exit(1)
token = res.json()['access_token']
headers = {'Authorization': 'Bearer ' + token}
print('Login OK')

q = {
    'primary_condition': 'Blood Cancer', 'condition_stage': 'Stage 2',
    'condition_duration': '1 to 3 years', 'prior_treatments': 'None',
    'current_medications': 'None', 'country': 'India', 'age': 34,
    'gender': 'Male', 'additional_notes': ''
}
r1 = requests.post('http://localhost:8000/questionnaire/submit', json=q, headers=headers)
print('Submit:', r1.status_code, '| query:', r1.json().get('search_query'))

print('Waiting 45s for scraper + LLM filter...')
time.sleep(45)

r2 = requests.get('http://localhost:8000/questionnaire/status', headers=headers)
d = r2.json()
print('Completed:', d.get('questionnaire_completed'), '| Matches:', d.get('external_matches_found'))

r3 = requests.get('http://localhost:8000/questionnaire/external-matches', headers=headers)
matches = r3.json().get('matches', [])
print('Total matches returned:', len(matches))
for m in matches[:8]:
    score = int(m.get('match_score', 0) * 100)
    tier = m.get('match_tier', '')
    name = m.get('trial_name', '')[:65]
    reason = m.get('match_reason', '') or ''
    concerns = m.get('concerns', '') or ''
    src = m.get('source_database', '')
    print('')
    print('  [' + tier + ' ' + str(score) + '%] ' + name)
    print('  Source: ' + src)
    if reason:
        print('  Reason: ' + reason[:90])
    if concerns:
        print('  Concern: ' + concerns[:70])
