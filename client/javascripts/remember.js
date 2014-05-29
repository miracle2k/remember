window.Remember = Ember.Application.create({LOG_TRANSITIONS: true});
Remember.ApplicationAdapter = DS.RESTAdapter.extend();


Remember.Router.map(function() {
  this.resource('things', { path: '/' });
});


// Models

Remember.Thing = DS.Model.extend({
  text: DS.attr('string'),
  date: DS.attr('momentDate', {defaultValue: function() { return momemt(); }}),
});

Remember.MomentDateTransform = DS.Transform.extend({
  serialize: function(value) {
    return value;
  },
  deserialize: function(value) {
    return value ? moment(value._d) || null : null;
  }
});


// 
Remember.GroupedThings = Ember.ArrayProxy.extend({
  init: function(modelToStartWith) {
    this.set('content', Ember.A());
    // this.content stores the actual model we expose, where the
    // groups are in a array, sorted. This is a registry giving us
    // direct access to a particular group's array.
    this.itemsByGroup = {};  

    modelToStartWith.addArrayObserver(this, {      
      willChange: function(array, offset, removeCount, addCount) {},
      didChange: function(array, offset, removeCount, addCount) {
        if (addCount > 0)
          this.add(array.slice(offset, offset + addCount))
      }
    });
  },

  // Sort multiple new things into the groups
  add : function(things) {
    var this$ = this;

    // Group all passed things by day    
    things.forEach(function(thing) {
      var groupKey = thing.get('date').clone().hours(0).minutes(0).seconds(0);

      // Create data structure for new groups
      if (!this$.itemsByGroup[groupKey]) {
        var newArray = Ember.A();
        this$.itemsByGroup[groupKey] = newArray;
        this$.get('content').pushObject({'date': groupKey, 'year': groupKey.year(), 'items': newArray});
      }

      this$.itemsByGroup[groupKey].pushObject(thing);
    });

    this.set('arrangedContent', this.get('content'));

    // Make sure the structure is still sorted by group date
    // var sorted = this.get('content').sort(function(a, b) { 
    //   return b.date.valueOf() - a.date.valueOf();
    // });  
    // this.replaceContent(0, sorted.get('length'), sorted);
  },

  // Remove an object from all groups where it appears
  remove : function() {
    // XXX
  }
});


// Extensions

Remember.EditThingView = Ember.TextArea.extend({
  // If not set, Shift+Enter is needed for a new line.
  // If set, Shift+Enter is needed for a submit.
  multilineByDefault: false,

  becomeFocused: function() {
    this.$().focus();
    this.$().elastic();
  }.on('didInsertElement'),

  handleKeyDown: function(e) {
    if (e.keyCode == 13) {
      // Xor?
      if ((this.multilineByDefault && e.shiftKey) || (!this.multilineByDefault && !e.shiftKey)) {
        this.sendAction('submit-edit');
        
        // Never allow that key to go to the textarea, or to the elastic handler.
        // Note: This requires our handler to be attached BEFORE the elastic one.
        // We might have to attach our stuff in the component init function as
        // oposed to this declarative way if this doesn't work as expected.
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    }
  }.on('keyDown')
});
Ember.Handlebars.helper('edit-thing', Remember.EditThingView);


Ember.Handlebars.registerBoundHelper('formatDate', function(date, format) {
  return moment(date).format(format || 'YYYY-MM-DD');
});


// Routes and Views

Remember.ThingsRoute = Ember.Route.extend({
  model: function() {
    return new Remember.GroupedThings(this.store.find('thing'));
  },
});


/**
 * Control the whole view of multiple things; mainly the "add new" form.
 */

Remember.Showdown = new Showdown.converter();

Remember.ThingsController = Ember.ArrayController.extend({
  tooltipVisible: false,
  newThing: "",
  sortProperties: ['year'],
  sortAscending: false,

  actions : {
    createThing: function() {
      var text = this.get('newThing').trim();
      if (!text) { return; }
      var thing = this.store.createRecord('thing', {text: text, date: moment()});
      this.set('newThing', '');
      thing.save();
    },

    newThingKeyPress: function() {
      // Hide the tooltip if visible
      this.set('tooltipVisible', false); 
      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

      // Do not show a tooltip if no content
      if (this.get('newThing') == '') return;

      // Show the tooltip with delay after the user inserted stuff
      var self = this;
      var show = function(){ self.set('tooltipVisible', true); };
      this.tooltipTimeout = _.delay(show, 1000);
    }
  }
})


/**
 * Control an individual "thing" item (edit, delete etc).
 */

Remember.ThingController = Ember.ObjectController.extend({
  isEditing: false,
  bufferedText: Ember.computed.oneWay('text'),

  actions : {
    editTodo: function () {
      this.set('isEditing', true);
    },
    doneEditing : function () {
      var bufferedText = this.get('bufferedText').trim();
      if (Ember.isEmpty(bufferedText)) {
        Ember.run.debounce(this, this.send, 'removeTodo', 0); 
      } else {
        var thing = this.get('model');
        thing.set('text', bufferedText);
        thing.save();
      }

      // Re-set our newly edited title to persist it's trimmed version
      this.set('bufferedText', bufferedText);
      this.set('isEditing', false);
    },
    cancelEditing: function () {
      this.set('bufferedText', this.get('text'));
      this.set('isEditing', false);
    },
    removeThing: function() {      
      var thing = this.get('model');
      if (confirm('"'+thing.get('text')+'" will be deleted?\n\nAre you sure?')) {
        thing.deleteRecord();
        thing.save();
      }
    }
  },

  text_formatted : function() {
    return Remember.Showdown.makeHtml(this.get('model').get('text')).htmlSafe();
  }.property('model.text')
})

