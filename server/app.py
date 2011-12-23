#!/usr/bin/env python
import json, uuid, shelve
from contextlib import contextmanager
from lockfile import FileLock
from flask import Flask, request
from flask.helpers import make_response

# Setup Flask app
app = Flask(__name__)
import config
app.config.from_object(config)

# Serve static files directly to ease setup
if app.config.get('CLIENT_PATH'):
    from werkzeug.wsgi import SharedDataMiddleware
    app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
        '/': config.CLIENT_PATH
    })

# Configure database
@contextmanager
def database():
    dbfilename = app.config['DATABASE']
    with FileLock(dbfilename):
        db = shelve.open(dbfilename)
        try:
            yield db
        finally:
            db.close()


def make_json_response(body, status_code=200):
    resp = make_response(json.dumps(body))
    resp.status_code = status_code
    resp.mimetype = 'application/json'
    return resp


@app.route('/things/', methods=['GET'])
def get_things():
    with database() as things:
        data = things.values()
        return make_json_response(data)

@app.route('/things/<thing_id>',  methods=['GET'])
def get_thing(thing_id):
    with database() as things:
        try:
            thing = things[thing_id]
        except KeyError:
            return make_json_response({'message': 'invalid id'}, 400)
        return make_json_response(thing)

@app.route('/things/', methods=['POST'])
def create_thing():
    with database() as things:
        new_thing = request.json
        new_thing['id'] = uuid.uuid4().hex
        things[new_thing['id']] = new_thing
        return make_json_response(new_thing)

@app.route('/things/<thing_id>',  methods=['PUT'])
def update_thing(thing_id):
    with database() as things:
        thing = request.json
        things.update({thing['id']: thing})
        return make_json_response({'message': 'OK'})

@app.route('/things/<thing_id>',  methods=['DELETE'])
def delete_thing(thing_id):
    with database() as things:
        del things[str(thing_id)]
        return make_json_response({'message': 'OK'})


if __name__ == '__main__':
    app.run()
