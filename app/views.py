from flask import render_template, Response, request
from app import siteshuttle
from pymongo import MongoClient
from bson import json_util
import json

db = MongoClient('localhost', 27017)['siteshuttle']
collection = 'GPS_data'

@siteshuttle.route('/')
@siteshuttle.route('/index')
def index():
    return render_template('index.html',
                           title='Home')

@siteshuttle.route('/data')
def data():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    tank_rotator = request.args.get('tank_rotator')
    power_source = request.args.get('power_source')
    temp_panel = request.args.get('temp_panel')

    speed_chart = db[collection].aggregate([
        {'$match':{'current_date.date': {'$gte': start_date, '$lt': end_date}, 'IMEI_number': tank_rotator}},
        {'$project':{'current_date': 1, 'value': '$Analog_2', '_id':0}},
        {'$sort': {'current_date.date': 1}}])

    temp_chart = db[collection].aggregate([
        {'$match':{'current_date.date': {'$gte': start_date, '$lt': end_date}, 'IMEI_number': temp_panel}},
        {'$project':{'current_date': 1, 'value': '$Analog_2', '_id':0}},
        {'$sort': {'current_date.date': 1}}])

    current_chart = db[collection].aggregate([
        {'$match':{'current_date.date': {'$gte': start_date, '$lt': end_date}, 'IMEI_number': power_source}},
        {'$project':{'current_date': 1, 'value': '$Analog_3', '_id':0}},
        {'$sort': {'current_date.date': 1}}])

    return Response(response=json_util.dumps({'speed_chart': speed_chart,
        'temp_chart': temp_chart, 'current_chart': current_chart}),
        mimetype='application/json')


@siteshuttle.route('/last_data')
def last_data():
    IMEI_number = request.args.get('IMEI_number')
    id = request.args.get('id') 

    field = 'Analog_3' if id == 'powerSource' else 'Analog_2'
    record = db[collection].find({'IMEI_number': IMEI_number},
        {'_id': 0, 'current_date.date': 1, str(field): 1}).sort('current_date.date', -1).limit(1).next()

    result = {'current_date': record['current_date'], 'value': record[str(field)]}
    return Response(response=json.dumps(result), mimetype='application/json')
