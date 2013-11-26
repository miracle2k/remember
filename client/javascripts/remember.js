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
    return this.store.find('thing');
  },
});


Remember.Showdown = new Showdown.converter();

Remember.ThingsController = Ember.ArrayController.extend({
  tooltipVisible: false,
  newThing: "",

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
  },
  
  groupedByDay : function() {
    var grouped =_.groupBy(this.get('model').toArray(), function(thing) {
      return thing.get('date').clone().hours(0).minutes(0).seconds(0); });    

    // Supposedly Ember's #each can iterate objects, but I cannot get it to work.
    // In any case, the order of an object is undefined, so this wouldn't be 
    // right anyway.
    var result = [];
    _.each(grouped, function(things, groupKey) {
      result.push({'date': groupKey, 'items': things.reverse()});
    });
    var sorted = _.sortBy(result, function(v) { return new Date(v.date); });  
    return sorted.reverse();
  }.property('@each.date')
})


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

