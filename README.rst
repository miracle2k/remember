Remember
========

A simple webapp to collect notes that you want to review later, in order
to help you memorize them. If that's not clear, don't worry, you probably
won't find it useful. It's a thing I do.

But maybe someone is interested in the code, which is backbone.js_ based.
In fact, it's a modified version of the backbone.js `Todo example app`__.

Notable external libraries used:

   - backbone.js_  in a `modified <https://github.com/miracle2k/backbone>`_
     version, with changes as used by Flow_.
   - jquery-elastic_ in a **modified** version, as used by Flow_.
   - moment.js_ for dates.
   - showdown.js_ for Markdown.


.. __: http://documentcloud.github.com/backbone/examples/todos/index.html
.. _backbone.js: http://documentcloud.github.com/backbone/
.. _showdown.js: http://github.com/coreyti/showdown
.. _moment.js: http://momentjs.com/
.. _jquery-elastic: http://unwrongest.com/projects/elastic/
.. _Flow: http://www.getflow.com


Contents
========

./client
    Contains the client-side Javascript code.
    Can potentially run stand-alone, e.g. localStorage based.

./server
    The thinnest Python WSGI application possible, just a
    JSON-interface to a Python shelve.


Running on Heroku
===========

Put app in Heroku mode:

::

    $ heroku config:set HEROKU=1

Support gem packages (sass compiler) on Heroku::

    $ heroku plugins:install https://github.com/heroku/heroku-buildpacks
    $ heroku buildpacks:set https://github.com/localmed/heroku-buildpack-python-extras.git
