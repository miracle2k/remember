#!/usr/bin/env python

"""Quick'n'Dirty utility to import from a text file into
the app's database.

Syntax: import-from-txt.py TEXTFILE DATABASE

Parsing the text file is very strict, and expects the following format::

    date parsable by python-dateutil
        - multi
          line
             item
        - item

Install requirements:

   $ easy_install python-dateutil==1.5
"""

import sys, codecs, uuid, shelve, dateutil.parser

_, textfile, database = sys.argv

things = []

# Parse the text file first
with codecs.open(textfile, 'r', encoding='utf8') as lines:
    line = next(lines)
    current_date = None
    try:
        while True:
            stripped = line.lstrip()
            if stripped.startswith('-'):
                assert current_date
                # Account for a potential space after the -
                if stripped.startswith('- '):
                    firstline = stripped[2:]
                else:
                    firstline = stripped[1:]

                # Indent that must match in subsequent lines is everything
                # to -, and then spaces for the -, and optional trailing
                # space as well.
                indent = line[:len(line)-len(stripped)] + \
                         ' '*(len(stripped)-len(firstline))
                content = [firstline.rstrip()]

                # Collect more lines
                while True:
                    line = next(lines)
                    # Item continues if same indentation
                    if line[:len(indent)] != indent or not line[:len(indent)].isspace():
                        break
                    content.append(line.rstrip()[len(indent):])

                # Create item with this content
                things.append({
                    'text': '\n'.join(content),
                    'date': {'_d': current_date.strftime('%Y-%m-%dT%H:%M:%SZ')},
                    'id': uuid.uuid4().hex
                })
                # Do not skip a line!
                continue
            elif stripped:
                date = line.strip()
                # Prepare date string for dateutil; note I'm still
                # using a patched version due to a bug.
                if len(date) < 7 and not date.endswith('.'):
                    # For dates not having a year, make sure they
                    # end in a dot.
                    date += '.'
                old_date = current_date
                try:
                    current_date = dateutil.parser.parse(
                        date, default=current_date, dayfirst=True)
                except:
                    print 'Cannot parse as date:', date
                    print
                    raise
                assert not old_date or current_date >= old_date
            line = next(lines)
    except StopIteration:
        pass


# Write data to shelve
data = shelve.open(database)
for thing in things:
    data[thing['id']] = thing
data.close()

print '%s things written' % len(things)
