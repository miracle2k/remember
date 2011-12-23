$(function(){

  // An thing to remember.
  window.Thing = Backbone.Model.extend(
  {
    defaults: function() {
      return {
        date: moment()
      }
    },

    // Note: This is non-standard backbone.js.
    _filter_date: function(val) {
      // Support reading a stringified Moment object.
      return val ? moment(val._d) || null : null;
    } ,

    _filter_text: function(val) { return val.trim(); }
  });


  // A list of things.
  window.ThingList = Backbone.Collection.extend(
  {
    model: Thing,
    url: '/things/',

    comparator: function(thing) {
      return -thing.get('date').valueOf();
    }
  });


  // Renders an individual thing, as a list item.
  window.ThingView = Backbone.View.extend({
  
    tagName: "li",
    className: "thing",

    showdown: new Showdown.converter(),
  
    template: _.template($('#item-template').html()),
  
    events: {
      "dblclick .thing-text"    : "edit",
      "click .thing-destroy"    : "clear",
      "keypress .thing-input"   : "updateOnEnter"
    },
    
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },
  
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      var text = this.model.get('text');
      var html = this.showdown.makeHtml(text);
      this.$('.thing-text').html(html);

      this.input = this.$('.thing-input');
      this.input.bind('blur', _.bind(this.close, this)).val(text);

      return this;
    },

    edit: function() {
      $(this.el).addClass("editing");
      this.$('textarea').elastic();
      this.input.focus();
    },
    
    close: function() {
      var _this = this;
      this.model.save({text: this.input.val()}, {
        success: function(model) {
          // Model validation may change the text
          _this.$('textarea').text(model.get('text'));
        }
      });
      $(this.el).removeClass("editing");
    },
  
    updateOnEnter: function(e) {
      //if (!event.shiftKey && e.keyCode == 13) this.close();
    },
    
    clear: function() {
      if (confirm('"'+this.model.get('text')+'" will be deleted?\n\nAre you sure?'))
        this.model.destroy();
    }
  });


  // Renders the main view with input field and list
  window.AppView = Backbone.View.extend({
  
    el: $("#remember"),

    groupTemplate: _.template($('#group-template').html()),

    events: {
      "keyup #new-thing"    : "showTooltip"
    },
  
    initialize: function() {
      this.things = this.options.things;
      this.input = this.$("#new-thing");

      // It's important we attach this as an event directly
      // to the textarea (instead of using backbone's events
      // hash, which delegates) because we want to stop certain
      // key events from reaching elastic. Thus, this also needs
      // to be attached BEFORE elastic's handler.
      this.input.on("keydown", _.bind(this.createOnEnter, this));

      // Make the textarea auto-expand; do this AFTER our own
      // keydown event handler, so if we refuse to accept a key,
      // elastic will not receive it either.
      this.input.elastic();

      this.things.bind('add', this.render, this);
      this.things.bind('remove', this.render, this);
      this.things.bind('reset', this.render, this);
      this.things.fetch();
    },

    render: function() {
      // For simplicity, for now, re-render the whole list
      var list = this.$("#things > ul");
      list.empty();
      groupElements = [];

      // Group items by date
      var grouped = this.things.groupBy(function(thing) {
        return thing.get('date').clone().hours(0).minutes(0).seconds(0); });

      // Render each group...
      var prevSeenYear = null;
      _.each(grouped, function(things, groupKey)
      {
        // Determine the formatted date to show for this group
        var groupDate = moment(groupKey);
        var dateFormat = (groupDate.year() != prevSeenYear) ? 'YYYY-MM-DD' : 'MM-DD';
        prevSeenYear = groupDate.year();

        var groupView = $(this.groupTemplate({text: groupDate.format(dateFormat)}));
        groupElements.push(groupView[0]);

        // ... and each item.
        _.each(things, function(thing) {
          var view = new ThingView({model: thing});
          $('> ul', groupView).append(view.render().el);
        });
      }, this);

      // Show the new list
      list.append(groupElements);
    },
  
    createOnEnter: function(e) {
      // Always remove trailing/leading whitespace
      var text = this.input.val().trim();

      //  Allow multiline with Shift
      if (e.shiftKey || e.keyCode != 13) return;

      // So we have unshifted ENTER. If there is a text, submit.
      if (text) {
        this.things.create({text: text});
        this.input.val('');
      }

      // Never allow that key to go to the textarea, or to the
      // elastic handler.
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    },
  
    showTooltip: function(e) {      
      var tooltip = this.$(".ui-tooltip-top");
      var val = this.input.val();
      tooltip.fadeOut();
      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
      if (val == '' || val == this.input.attr('placeholder')) return;
      var show = function(){ tooltip.show().fadeIn(); };
      this.tooltipTimeout = _.delay(show, 1000);
    }
  });


  // Start the app
  window.App = new AppView({
    things: new ThingList
  });

});
