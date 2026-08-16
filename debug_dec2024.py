import docx, os, unicodedata

BASE = r"c:\Users\ATD\Desktop\cle\TLWM\dash"
doc = docx.Document(os.path.join(BASE, "2024", "Rapport Mensuel DNMF TOGO DECEMBRE 2024.docx"))

def norm(s):
    s = unicodedata.normalize('NFD', str(s).lower())
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn').strip()

for t_idx, table in enumerate(doc.tables[:8]):
    r0 = table.rows[0].cells[0].text.strip() if table.rows else ''
    r1 = table.rows[1].cells[0].text.strip() if len(table.rows) > 1 else ''
    r0n = norm(r0)
    r1n = norm(r1)
    print("\nT{}: r0='{}' r1='{}'".format(t_idx, r0[:50], r1[:30]))
    print("  norm: r0='{}' r1='{}'".format(r0n[:50], r1n[:30]))
    if r1n == 'mois':
        print("  --> FOUND MOIS TABLE, rows:", len(table.rows))
        for row in table.rows[2:8]:
            cells = [c.text.strip()[:25] for c in row.cells[:5]]
            if any(c.strip() for c in cells):
                print("    ", " | ".join(cells))
