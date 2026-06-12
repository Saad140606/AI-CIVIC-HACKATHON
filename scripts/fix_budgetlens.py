import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
budget = root / 'budgetlens'
ignore = shutil.ignore_patterns('node_modules', '.git', 'dist', '.env', '.env.*')

if budget.exists():
    shutil.rmtree(budget, ignore_errors=False)
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
