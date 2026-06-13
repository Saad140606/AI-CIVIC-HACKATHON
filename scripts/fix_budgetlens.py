#!/usr/bin/env python3
"""
Sync Script for budgetlens Sub-directory Layout
----------------------------------------------
This script replicates the root-level /backend and /frontend directories into
the sub-directory /budgetlens/backend and /budgetlens/frontend (excluding node_modules,
dist, environment files, and git history).

Run this script prior to committing and pushing to GitHub if your production host (like Railway)
expects the application code to reside inside the /budgetlens subfolders rather than at the root.

Usage:
  python scripts/fix_budgetlens.py
"""
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
budget = root / 'budgetlens'
ignore = shutil.ignore_patterns('node_modules', '.git', 'dist', '.env', '.env.*')

if budget.exists():
    # Safely clean up old files in budgetlens, preserving node_modules
    for item in budget.iterdir():
        if item.is_dir():
            for subitem in item.iterdir():
                if subitem.name == 'node_modules':
                    continue
                try:
                    if subitem.is_dir():
                        shutil.rmtree(subitem, ignore_errors=True)
                    else:
                        subitem.unlink(missing_ok=True)
                except Exception:
                    pass
        else:
            try:
                item.unlink(missing_ok=True)
            except Exception:
                pass
else:
    budget.mkdir(exist_ok=True)

for name in ('backend', 'frontend'):
    src = root / name
    dst = budget / name
    shutil.copytree(src, dst, dirs_exist_ok=True, ignore=ignore)

print('Rebuilt budgetlens layout:')
print('  backend exists =', (budget / 'backend').exists())
print('  frontend exists =', (budget / 'frontend').exists())
print('  backend files =', len(list((budget / 'backend').rglob('*'))))
print('  frontend files =', len(list((budget / 'frontend').rglob('*'))))
