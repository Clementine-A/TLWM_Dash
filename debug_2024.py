"""
Debug: affichage complet des tables du fichier Juin 2024 (le plus complet)
"""
import docx, os

BASE = r"c:\Users\ATD\Desktop\cle\TLWM\dash"
doc = docx.Document(os.path.join(BASE, "2024", "Rapport Mensuel DNMF TOGO JUIN 2024.docx"))

for t_idx, table in enumerate(doc.tables):
    print("\n--- TABLE {} ({} rows x {} cols) ---".format(t_idx, len(table.rows), len(table.columns)))
    for r_idx, row in enumerate(table.rows[:20]):
        cells = [c.text.strip()[:40] for c in row.cells[:6]]
        if any(c.strip() for c in cells):
            print("  [{:02d}] {}".format(r_idx, " | ".join(cells)))
