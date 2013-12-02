from os import environ
from os.path import join, dirname
THIS = dirname(__file__)

USE_SHOVE = True
DATABASE = environ.get('DATABASE_URL')

DEBUG = False
CLIENT_PATH = join(THIS, '..', 'client')
