from os import environ

from config import *

USE_SHOVE = True
DATABASE = environ.get('DATABASE_URL')
