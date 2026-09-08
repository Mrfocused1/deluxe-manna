"""Compatibility command: regenerate the menu partial, then assemble the site."""
from pathlib import Path
import subprocess
import sys


def main():
    root = Path(__file__).resolve().parents[1]
    for script in ('build-menu-v2.py', 'build-site.py'):
        subprocess.run([sys.executable, str(root / 'scripts' / script)], cwd=root, check=True)


if __name__ == '__main__':
    main()
