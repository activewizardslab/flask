import sys
import os
sys.path.insert(0, '/var/www/html/siteshuttle')

path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if path not in sys.path:
    sys.path.append(path)

from app import siteshuttle as application