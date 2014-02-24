#!/usr/bin/env python
import os
from os import path
import json, uuid
from contextlib import contextmanager
import confcollect
from flask import Flask, request, Request, Response
from werkzeug.wrappers import Response as WSGIResponse
from flask.helpers import make_response

# Setup Flask app
app = Flask(__name__)

app.config.update({
    'DATABASE': 'remember',
    'USE_SHOVE': False,
    'CLIENT_PATH': path.join(path.dirname(__file__), '..', 'client'),
    'AUTH': {}
})

try:
    import config
except ImportError:
    pass
else:
    app.config.from_object(config)

if os.environ.get('HEROKU'):
    import heroku_config
    app.config.from_object(heroku_config)

app.config.update(confcollect.from_environ(by_defaults=app.config))

# Serve static files directly to ease setup
if app.config.get('CLIENT_PATH'):
    from werkzeug.wsgi import SharedDataMiddleware
    app.wsgi_app = SharedDataMiddleware(app.wsgi_app, {
        '/': app.config['CLIENT_PATH']
    })

    @app.route('/', methods=['GET'])
    def index():
        with open(path.join(app.config['CLIENT_PATH'], 'index.html'), 'r') as f:
            return f.read()

# Configure database
if app.config.get('USE_SHOVE', False):
    import shove

    db = shove.Shove(app.config['DATABASE'])

    @contextmanager
    def database():
        yield db
else:
    import shelve
    from lockfile import FileLock

    @contextmanager
    def database():
        dbfilename = app.config['DATABASE']
        folder = path.dirname(dbfilename)
        if folder and not path.exists(folder):
            os.mkdir(folder)
        with FileLock(dbfilename):
            db = shelve.open(dbfilename)
            try:
                yield db
            finally:
                db.close()

# Setup authentication; write this as a WSGI middleware
# so we can protect the whole app, including the
# SharedDataMiddleware.
def requires_auth(wrapped_app):
    def middleware(environ, start_response):
        request = Request(environ)
        auth = request.authorization
        users = app.config.get('AUTH', None)
        # I prefer only an explicit AUTH=None disable auth, but
        # for that, confcollect would need to support specs.
        if users and (
               not auth or not users.get(auth.username, False)
                    == auth.password):
            return WSGIResponse(
                'Could not verify your access level for that URL.\n'
                'You have to login with proper credentials', 401,
                {'WWW-Authenticate': 'Basic realm="Login Required"'})(
                    environ, start_response)
        return wrapped_app(environ, start_response)
    return middleware
app.wsgi_app = requires_auth(app.wsgi_app)


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
        things.update({str(thing['id']): thing})
        return make_json_response({'message': 'OK'})

@app.route('/things/<thing_id>',  methods=['DELETE'])
def delete_thing(thing_id):
    with database() as things:
        del things[str(thing_id)]
        return make_json_response({'message': 'OK'})


if __name__ == '__main__':
    app.run()
