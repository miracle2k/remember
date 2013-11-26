/**
 * Note: This was taken from the getflow.com website, which seems to have
 * modified it to get rid of the flickering, where the text is shortly
 * not visible when the textarea is expanding, until it scrolls into view
 * again.
 *
 *
 *  @name              Elastic
 *  @descripton            Elastic is Jquery plugin that grow and shrink your textareas automaticliy
 *  @version            1.6.3
 *  @requires            Jquery 1.2.6+
 *
 *  @author              Jan Jarfalk
 *  @author-email          jan.jarfalk@unwrongest.com
 *  @author-website          http://www.unwrongest.com
 *
 *  @licens              MIT License - http://www.opensource.org/licenses/mit-license.php
 */

(function (jQuery) {


  jQuery.fn.extend({
    elastic:function () {

      //	We will create a div clone of the textarea
      //	by copying these attributes from the textarea to the div.
      var mimics = [
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'fontSize',
        'lineHeight',
        'fontFamily',
        'width',
        'fontWeight'];

      return this.each(function () {
        var updating = false;

        // Elastic only works on textareas
        if (this.type != 'textarea') {
          return false;
        }

        var $textarea = jQuery(this),
            $twin = jQuery('<div />').css({'position':'absolute', 'display':'none', 'word-wrap':'break-word'}),
            lineHeight = parseInt($textarea.css('line-height'), 10) || parseInt($textarea.css('font-size'), '10'),
            minheight = parseInt($textarea.css('height'), 10) || lineHeight * 3,
            maxheight = parseInt($textarea.css('max-height'), 10) || Number.MAX_VALUE,
            goalheight = 0,
            i = 0;

        if ($textarea.data('is-elastic') == true) return;

        // Opera returns max-height of -1 if not set
        if (maxheight < 0) {
          maxheight = Number.MAX_VALUE;
        }

        // Append the twin to the DOM
        // We are going to meassure the height of this, not the textarea.
        $twin.appendTo($textarea.parent());

        // Copy the essential styles (mimics) from the textarea to the twin
        var i = mimics.length;
        while (i--) {
          $twin.css(mimics[i].toString(), $textarea.css(mimics[i].toString()));
        }


        // Sets a given height and overflow state on the textarea
        function setHeightAndOverflow(height, overflow) {
          var curratedHeight = Math.floor(parseInt(height, 10));
          if ($textarea.height() != curratedHeight) {
            $textarea.css({'height':curratedHeight + 'px', 'overflow':overflow});
            $textarea.trigger('resized.elastic');
          }
        }

        function is_keycode_printable(keycode) {
          if (keycode == 32 || // space
              (keycode >= 48 && keycode <= 90) || // 0-1a-z
              (keycode >= 96 && keycode <= 111) || // numpad 0-9 + - / * .
              (keycode >= 186 && keycode <= 192) || // ; = , - . / ^
              (keycode >= 219 && keycode <= 222)       // ( \ ) '
              ) {
            return true;
          } else {
            return false;
          }
        }

        // This function will update the height of the textarea if necessary
        function update(preempt) {
          var _textarea_content = $textarea.val();

          if (preempt != null) {
            if (preempt.which == 13)
              _textarea_content += "\n";
            else if (is_keycode_printable(preempt.which))
              textareaContent += preempt.shiftKey ? String.fromCharCode(preempt.which) : String.fromCharCode(preempt.which).toLowerCase();
          }

          // Get curated content from the textarea.
          var textareaContent = _textarea_content.replace(/&/g, '&amp;').replace(/  /g, '&nbsp;').replace(/<|>/g, '&gt;').replace(/\n/g, '<br />');

          var twinContent = $twin.html();

          if (textareaContent + '&nbsp;' != twinContent) {
            // Add an extra white space so new rows are added when you are at the end of a row.
            $twin.html(textareaContent + '&nbsp;');

            // Change textarea height if twin plus the height of one line differs more than 3 pixel from textarea height
            if (Math.abs($twin.height() + lineHeight - $textarea.height()) > 3) {
              var goalheight = $twin.height();
              if (goalheight >= maxheight) {
                setHeightAndOverflow(maxheight, 'auto');
              } else if (goalheight <= minheight) {
                setHeightAndOverflow(minheight, 'hidden');
              } else {
                setHeightAndOverflow(goalheight, 'hidden');
              }
            }
          }
        }

        // Hide scrollbars
        $textarea.css({'overflow':'hidden'});

        // Update textarea size on keyup
        $textarea.unbind('keyup.elastic').bind('keyup.elastic',
            function (e) {
              if (!updating) {
                updating = true;
                setTimeout(function () {
                  updating = false;
                }, 100);
                update();
              }
            }).unbind('keydown.elastic').bind('keydown.elastic', function (e) {
              update(e);
            });

        // And this line is to catch the browser paste event
        $textarea.live('input paste', function (e) {
          setTimeout(update, 250);
        });

        // Run update once when elastic is initialized
        update();

        $textarea.data('is-elastic', true);
      });
    }
  });
})(jQuery);
