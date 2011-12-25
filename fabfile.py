from fabric.api import local, put, env, run
from fabric.main import load_settings
from os import path


settings = load_settings('.fabricrc')
if not settings:
    raise RuntimeError('.fabricrc is needed')
env.update(settings)


env.hosts = [env.host]
env.filename = 'remember.tar.gz'


def deploy():
    push()


def push():
    if not path.exists('server/app.py'):
        # Quick hack to make sure we no longer run this from
        # a child directory by accident, and put an incomplete
        # set of files into the wrong directory on the server.
        # A proper fix would always pack the full git archive
        # no matter to working directory.
        raise ValueError("You need to run this from the root directory!")
    local('git archive --format=tar HEAD | gzip > %s' % env.filename)
    put('%s' % env.filename, '/tmp/%s' % env.filename)
    run('cd %s && tar xzf /tmp/%s' % (env.target_path, env.filename))

    # The stylesheet also
    local('cd client && sass --update css-src:stylesheets')
    put('client/stylesheets/', '%s/client/' % env.target_path)

def stylesheet():
    put('server/test.db', '/srv/remember/data/')

