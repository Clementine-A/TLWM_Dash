"""
Debug: afficher toutes les tables des fichiers 2024 pour identifier la structure exacte
"""
import docx, os

BASE = r"c:\Users\ATD\Desktop\cle\TLWM\dash"

files_debug = [
    ("2024", "Rapport Mensuel DNMF TOGO Janvier.docx"),
    ("2024", "Rapport Mensuel DNMF TOGO JUIN 2024.docx"),
    ("2025", "DAMF RAPPORT NATIONAL TOGO Jan 2025.docx"),
]

for folder, fname in files_debug:
    path = os.path.join(BASE, folder, fname)
    print("\n" + "="*70)
    print(f"{folder}/{fname}")
    print("="*70)
    doc = docx.Document(path)
    for t_idx, table in enumerate(doc.tables):
        print(f"\n--- TABLE {t_idx} ({len(table.rows)} rows x {len(table.columns)} cols) ---")
        for r_idx, row in enumerate(table.rows[:6]):  # max 6 rows
            cells = [c.text.strip()[:30] for c in row.cells[:5]]  # max 5 cols
            if any(cells):
                print(f"  [{r_idx}] " + " | ".join(cells))
