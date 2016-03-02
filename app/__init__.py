from flask import Flask

siteshuttle = Flask(__name__)
from app import views
