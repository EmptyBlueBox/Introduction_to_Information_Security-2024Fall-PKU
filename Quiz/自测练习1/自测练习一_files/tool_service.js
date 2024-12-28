
/**
 * This service tracks tool activity and disseminates tool activity counts to all registered subscribers.
 * It does this by calling periodically (and asynchronously) down to the server, requesting the latest
 * activity data, and then disseminating it to its subscribers.
 *
 * Subscriber Registration
 * -----------------------
 *
 * To register as a subscriber, call tool_service.register and pass in:
 *
 *   * An id we can use to identify you
 *   * The listener to call when new activity data arrives
 *
 * A typical registration might looks something like this:
 *
 *   top.tool_service.register ( 'toolListener', listener );
 *
 * (see below for information on how to define a listener object)
 *
 * Subscribers should explicitly unregister when they no longer require our services.
 * Generally, you want to do this when your container is about to disappear, by attaching
 * an unregister call to the _unload_ handler. Something like this:
 *
 *   Event.observe ( window, "unload", function() {
 *     top.tool_service.unregister ( 'toolListener' );
 *   });
 *
 *
 * Listeners
 * ---------
 *
 * The listener object must implement the following functions:
 *
 *   * activityCountsUpdated: Called when the entire activity store has been refreshed
 *   * activityCountUpdated:  Called when activity for a single tool has been updated. Accept a tool id.
 *
 * These functions don't receive any actual activity information -- they're expected
 * to call back into the service to get the details they need. An example listener:
 *
 *   var activityListener = {
 *
 *     activityCountsUpdated : function () {
 *
 *       if ( top.tool_service.getActivityCounts() ) {
 *
 *         top.tool_service.getActivityCounts().each ( function ( pair ) {
 *           var toolKey = pair.key;
 *           var toolCount = pair.value;
 *           ...
 *         } );
 *       }
 *
 *     },
 *
 *     activityCountUpdated : function ( toolId ) {
 *
 *       var actitityCount = top.tool_service.getActivityCountForTool(toolId);
 *       ...
 *
 *     }
 *
 *   }
 *
 *.
 * Dependencies
 * ------------
 *
 * This depends on ToolActivityService, a DWR library that handles the call down to the backend
 * server to get activity data.
 *
 * @author  rshehadeh
 * @since   Bb 9.1 SP10
 */
var tool_service = {


  // ----- public stuff

  MAX_COUNT         : 500,
  MAX_TOOL_COUNT    : 100,
  CACHE_KEY         : "tool_activity",
  CACHE_REFRESH_KEY : "tool_activity_last_refreshed",


  init: function ( refreshInterval, suppressTimestampUpdateHeader )
  {

    // if the refreshInterval is legit and this timer hasn't been set, then set it.
	this.refreshInterval = refreshInterval;
    if( refreshInterval > 0 && !this.intervalId ) {
      this.intervalId = setInterval( this.getActivityData.bind( this ), refreshInterval );
    }

    // the name of the header this service should use to suppress session timestamp updates
    // when requesting new tool info
    this.suppressTimestampUpdateHeader = suppressTimestampUpdateHeader;

    this.initialized = true;
    if ( this.listenersRegisteredBeforeInit ) {
      this.getActivityData();
    }
  },

  /**
   * Register with the tool service. Registered entities will receive notifications
   * when new activity counts come in. They must call unregister when their parent
   * context is unloaded or otherwise goes away (probably using an _onunload_ handler).
   *
   * @param  id              The id of the registering entity. Must use the same id when unregistering.
   * @param  listener        The listener to invoke when new activity comes in
   * @param  ignoreCache     If true, will force a pull from the database
   */
  register: function( id, listener, ignoreCache ) {

    // register the listener
    this.registerListener ( id, listener );

    // get new activity data but only after we have been init'd (so that refreshInterval is available)
    if ( this.initialized ) {
      this.getActivityData( ignoreCache ); // notifies all listeners, including this newly registered one
    } else {
      this.listenersRegisteredBeforeInit = true;
    }

  },


  /**
   * Unregister the listener with the given id. The id should be the same with which
   * the listener was registered.
   *
   * @param  id  The id of the registering entity. Must use the same id when unregistering.
   */
  unregister: function ( id ) {
    this.unregisterListener ( id );
  },


  /**
   * Calls down to the server to get the latest activity data for all tools. When
   * the results comes back, informs all registered listeners.
   * @param ignoreCache if true, will force service to hit the db instead of settling for a cached value
   */
  getActivityData: function ( ignoreCache ) {

    // only phone home if we have listeners registered
    if ( this.listeners.size() > 0 ) {

      // build the callback object for the tool service call
      var activityObj = {

        callback: function ( map ) {

          // if the user's session is still active, evaluate the results
          if ( map ) {
              // if the user is "active", i.e. the session has been updated in the last 15 minutes
              if(!this.isEmpty(map)) {
                  this.activityData = $H(map);

                  // inform a listeners that new counts have arrived
                  this.listeners.each ( function ( pair ) {

                    try {
                      pair.value.activityCountsUpdated();
                    }

                    catch (e) {

                      // account for the case that a listener in a context that's been unloaded
                      // is no longer there (eg, a disposed frame/iframe; which is only possible if
                      // the listener in question failed to unregister). if we run across one of
                      // these malefactors, unregister it.
                      if ( e.name === "TypeError" || e.name === "Error" ) {
                        this.unregisterListener ( pair.key );
                        // TODO swallow this for now; need better logging mechanism
                      }
                    }
                  }.bind(this));

                  ClientCache.setItem( this.CACHE_KEY, JSON.stringify( map ) );
              }
          }

          // the user is not logged in, or his session has timed out, or he's a guest; in any
          // case, no need to keep pinging for activity data
          else {
            clearInterval(this.intervalId);
          }

        }.bind(this),

        errorHandler: function ( errorString, exception ) {
          // TODO: swallow this for now; need to find a way to report this to users without
          //       annoying popups
        },

        headers: {}

      };

      var usingCachedValues = false;
      try {
        var lastRefresh = ClientCache.getItem( this.CACHE_REFRESH_KEY );
        // Date.now() is ms since epoch in utc
        if ( !ignoreCache && lastRefresh && ( Date.now() - lastRefresh < this.refreshInterval ) ) {
          var cachedValues = ClientCache.getItem( this.CACHE_KEY );
          if ( cachedValues ) {
            var cachedMap = JSON.parse( cachedValues );
            activityObj.callback( cachedMap ); // notify all listeners with the cached values
            usingCachedValues = true;
          }
        }
      }
      catch ( e ) {
        // do nothing, just call backend service for values
      }
      
      if ( !usingCachedValues ) {
        // this header ensures that the call doesn't register against the user's session
        // timeout tracker
        activityObj.headers[this.suppressTimestampUpdateHeader] = "true";

        ToolActivityService.getActivityForAllTools ( ignoreCache, activityObj );
        // setting cached time here instead of callback since we're reusing that callback with cached data
        ClientCache.setItem( this.CACHE_REFRESH_KEY, Date.now() );
      }

    }

  },


  /**
   * Calls down to the server to get the latest activity count for a given tool. When
   * the results comes back, informs all registered listeners.
   *
   * @param toolId The fully-qualified id of the tool to
   * @param userId The id to the user to get activity data for
   */
  /*jslint funcscope: true */
  getActivityDataForTool: function ( toolId ) {

    // only phone home if we have listeners registered
    if ( this.listeners.size() > 0 ) {

      // build the callback object for the call to get tool activity
      var activityObj = {

        callback: function ( activityCount ) {

          if ( activityCount >= 0 ) {

            this.activityData.set ( toolId, activityCount );

            this.listeners.each ( function ( pair) {
              try {
                pair.value.activityCountUpdated( toolId );
              }

              catch (e) {

                // account for the case that a listener in a context that's been unloaded
                // is no longer there (eg, a disposed frame/iframe; which is only possible if
                // the listener in question failed to unregister). if we run across one of
                // these malefactors, unregister it.
                if ( e.name === "TypeError" || e.name === "Error" ) {
                  this.unregisterListener ( pair.key );
                  // TODO swallow this for now; need better logging mechanism
                }

              }

            });

          }

          // the user is not logged in, or his session has timed out, or he's a guest; in any
          // case, no need to keep pinging for activity data
          else {
            clearInterval(this.intervalId);
          }


        }.bind(this),

        errorHandler: function ( errorString, exception ) {
           // TODO: swallow this for now; need to find a way to report this to users without
           //       annoying popups
        },

        headers: {}

       };

      }

     // this header ensures that the call doesn't register against the user's session
     // timeout tracker
      activityObj.headers[this.suppressTimestampUpdateHeader] = "true";

      ToolActivityService.getActivityForTool ( toolId, activityObj );

  },


  /**
   * Get the total activity account, across all tools.
   */
  getTotalActivityCount : function ( ) {

    var total = 0;

    this.activityData.values().collect ( function ( count, total ) {
      total += count;
    } );

    return total;

  },


  /**
   * Returns activity counts for the tool corresponding to the given id. If no counts
   * are available (or the tool doesn't exist) returns null.
   *
   * @param toolId  The id of the tool
   * @return        The count, or null
   */
  getActivityCountForTool: function ( toolId ) {
    return this.activityData.get(toolId) ? this.activityData.get(toolId) : null;
  },


  /**
   * Returns a hash of all extant tool activity counts, in the form;
   *
   *   [tool id] => [count]
   */
  getActivityCounts: function () {
    return this.activityData;
  },

  /**
   * check if a map is empty or not
   *  
   */
  isEmpty: function (map) {
      for(var key in map) {
          if (map.hasOwnProperty(key)) {
              return false;
          }
      }
      return true;
  },
	
  /**
   * Formats an activity count for display. If the count is larger than the
   * given max, abbreviates it to that max, with an indication that there's
   * more.
   *
   * @param count The count to format
   * @param max   The max value to display
   */
  formatCount:  function ( count, max ) {
    return count > max ? max + "+" : count;
  },


  // ----- private stuff

  intervalId: null,

  // activity data
  activityData : $H(),

  // activity listeners
  listeners: $H(),


  /**
   * Register a listener, and tie it to the given id. Existing listeners with the
   * same id will be ovewritten.
   *
   * @param id        The id of listener
   * @param listener  The listener.
   */
  registerListener: function ( id, listener ) {
    this.listeners.set ( id, listener );
  },


  /**
   * Unregister a single listener, with the given id.
   *
   * @param id  The id of listener
   */
  unregisterListener: function ( id ) {
    this.listeners.unset ( id );
  }

};
