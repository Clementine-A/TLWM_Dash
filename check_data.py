import json
with open('tlwm-dashboard/src/data/realData.json', encoding='utf-8') as f:
    d = json.load(f)
for year in ['2024','2025']:
    print('\n=== ' + year + ' ===')
    for m in d[year]['monthlyData']:
        print(m['month'].ljust(12) + ': sem=' + str(m['sem_total']).rjust(3) +
              ' assist=' + str(m['assistance']).rjust(5) +
              ' sauves=' + str(m['sauves']).rjust(4) +
              ' ajoutes=' + str(m['ajoutes']).rjust(3) +
              ' membres=' + str(m['membres']).rjust(5) +
              ' pred=' + str(m['predicateurs']).rjust(3))
print('\nDone.')
