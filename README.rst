Remember
========

A simple webapp to collect notes that you want to review later, in order
to help you memorize them. If that's not clear, don't worry, you probably
won't find it useful. It's a thing I do.

This was originally based on the backbone.js `Todo example app`__.

Notable external libraries used:

   - Ember.js
   - jquery-elastic_ in a **modified** version.
   - moment.js_ for dates.
   - showdown.js_ for Markdown.


.. __: http://documentcloud.github.com/backbone/examples/todos/index.html
.. _showdown.js: http://github.com/coreyti/showdown
.. _moment.js: http://momentjs.com/
.. _jquery-elastic: http://unwrongest.com/projects/elastic/


Contents
========

./client
    Contains the client-side Javascript code.
    Can potentially run stand-alone, e.g. localStorage based.

./server
    The thinnest Python WSGI application possible, just a
    JSON-interface to a Python shelve.
