var globalNavMenu = {

  // how long after the menu loses focus to wait, before closing it
  MENU_CLOSE_TIMER_INTERVAL: 1000,

  // the id of the timer responsible for closing the menu
  menuCloseTimerId : null,

  // the key code for the space key
  KEY_SPACE: 32,

  ACTIVE_SECTION_KEY: "globalNavMenu:activeSection",

  /**
   * Starts a timer that closes the menu after a short interval.
   */
  initiateMenuClose : function () {
    globalNavMenu.menuCloseTimerId = setTimeout ( function() { globalNavMenu.toggleMenu(false); }, globalNavMenu.MENU_CLOSE_TIMER_INTERVAL );
  },


  /**
   * Called when the menu loses focus.
   *
   * @param event An onmouseout event
   */
  menuAbandoned: function (event) {

    // figure out where the mouse has moved to
    var target = event.toElement || event.relatedTarget;

    // if it hasn't moved anywhere within the confines of the menu or its invoking link,
    // start the process of closing it
    if ( target && target != $("global-nav-flyout") && !target.up("#global-nav-flyout") && target != $("global-nav") && !target.up("#global-nav") ) {
      globalNavMenu.initiateMenuClose();
    }
  },


  /**
   * Called when the menu gains focus
   */
  menuEntered: function () {

    // if the menu is scheduled to be closed, cancel the close
    if ( globalNavMenu.menuCloseTimerId ) {
      clearTimeout(globalNavMenu.menuCloseTimerId);
      globalNavMenu.menuCloseTimerId = null;
    }

  },


  /**
   * Initialize the menu.
   */
  init : function( toolActivityEnabled )
  {
    // initialize the tool_service
    if ( toolActivityEnabled )
    {
      window.tool_service.register ( "globalnavmenu", globalNavMenu.activityListener );
      globalNavMenu.attachEventHandlers();
    }
    else
    {
      var tbodyElement = $j( '#appTabList' ).children( 'tbody' );
      tbodyElement.addClass( "guestTbody" );
    }

    if (window.matchMedia("(max-width: 1037px)").matches && window.matchMedia("(min-width: 320px)").matches)
    {
      globalNavMenu.mobileMenuMods();
    }

    $j(window).on("resize", function() {
      if($j(window).width() < 1038 && $j(window).width() > 319)
      {
        globalNavMenu.mobileMenuMods();
      }
      else
      {
        globalNavMenu.reverseMobileMenuMods();
      }
    });
  },

  attachEventHandlers : function ()
  {
    // Since the global nav menu should open only as tall as the current size of the browser window
    // (so that users do not have to scroll to access the left-hand-side tools when there are lots of 
    // them), close the global nav menu when the user resizes the browser window. Make an exception for mobile
    // browsers (ok, just Safari for now) since one cannot intentionally resize a window (though resize 
    // events do fire indirectly as a consequence of user actions such as orientation change) in a mobile (iOS)
    // device.
    if ( !Prototype.Browser.MobileSafari )
    {
      Event.observe( window, "resize", function() { globalNavMenu.toggleMenu( false ); } );
    }

    Event.observe( window, "beforeunload", function() { globalNavMenu.toggleMenu( false ); } );

    // for ie only, we invoke the menu when the link is focused, because that's the only way
    // to get it to open with the accesskey -- IE fires a focus event, not a click event,
    // when the menu's access key is pressed
    if ( Prototype.Browser.IE ) {
      $("global-nav-link").observe( "focus", globalNavMenu.onNavLinkClick );
      $("global-nav-link").observe( "click", globalNavMenu.preventDefault );
    }
    else {
      $("global-nav-link").observe( "click", globalNavMenu.onNavLinkClick );
    }

    // watch for focus entering/exiting the menu or the menu header
    $("global-nav-link").observe( "mouseout", globalNavMenu.menuAbandoned );
    $("global-nav-link").observe( "mouseover", globalNavMenu.menuEntered );
    $("global-nav-flyout").observe( "mouseout", globalNavMenu.menuAbandoned );
    $("global-nav-flyout").observe( "mouseover", globalNavMenu.menuEntered );

    // attach event handlers to the bottom buttons 
    $$(".bottom-buttons a").each( function ( bottomButton ) {

      // keyboard navigation for the bottom buttons
      bottomButton.observe( "keydown", function(event) {
      
        var key = event.keyCode;

        switch (key) {

          // down takes you to the next button over
          case Event.KEY_DOWN:
            var nextButton = this.up("li").next();
            if (nextButton) { 
              nextButton.down("a").focus();
            }
            event.stop();
            break;

          // up takes you to the previous button, or the previous section if we're already 
          // at the leftmost extent of the button area
          case Event.KEY_UP:

            // if this is the first button, jump back up the last section
            if ( this == $$(".bottom-buttons a:first").first() )  {
              
              var lastSection = $$(".accordion-wrapper div.accordion_toggle:last").first();
              if ( lastSection ) {
                lastSection.focus();
              }
            } 

            // otherwise, move to the previous button
            else {              
              this.up(0).previous('li', 0).down('a', 0).focus();
            }

            event.stop();

            break;   
            
          case Event.KEY_TAB:

            // if this is the last button, close the menu
            if ( this == $$(".bottom-buttons a:last").first() && !event.shiftKey) {
              globalNavMenu.keyboardCloseMenu();
              event.stop();
            }
            
            break;
            
        }

      });

    });
    


    // keyboard navigation for the menu
    $("global-nav-flyout").observe( "keydown", function(event) {

      var key = event.keyCode;

      if (key === Event.KEY_ESC ) {
        // escape closes the menu
          globalNavMenu.keyboardCloseMenu();
      }

    });
    
    $("topframe.logout.label").observe( "click", function(event){
      ClientCache.clear();
    });
  },

 attachEventHandlersInsideFlyout : function ()
 {
  // watch for menu rail shortcut clicks
  $$("#global-list-tools a").each( function( shortcut )  {
    if ( !shortcut.onclick ) {
      shortcut.observe( "click", globalNavMenu.onShortcutClick );
    }
  });

  // attach event handlers to section headers
  $$(".accordion_toggle").each( function( sectionHeader ) {

    // open/close the section when its header is clicked
    sectionHeader.observe( "click", globalNavMenu.onSectionClick );

    // watch for keyboard events on the section headers
    sectionHeader.observe( "keydown", function (event) {

      var contentArea = this.down();
      
      var sectionId = contentArea.readAttribute( "data-section-id" );
      var sectionUri = contentArea.readAttribute( "data-section-uri" );

      var sectionContent = $(sectionId+'-content');
      var sectionTitle = $(sectionId+'-title');
      
      // TODO is there a more generic way to do this
      var key = event.keyCode;
      
      switch (key) {
        
        // open the section
        case Event.KEY_RETURN:
        case Event.KEY_RIGHT:
        case globalNavMenu.KEY_SPACE:
          
          if ( !sectionContent.visible() ) {
            globalNavMenu.openSection( sectionContent, sectionUri );
          }
          
          globalNavMenu.focusFirstSectionLink(sectionContent);
          
          event.stop();
          break;
          
        // move focus to the next section header
        case Event.KEY_DOWN:

          var nextToggle = sectionTitle.next(".accordion_toggle");

          // if there's another section below us
          if ( nextToggle ) {
            nextToggle.focus();
          }

          // otherwise, we're at the bottom of the section area
          else {
            $('topframe.home.label').focus();
          }

          event.stop();

          break;
          
        // focus the previous section header
        case Event.KEY_UP:
          var previousToggle = sectionTitle.previous(".accordion_toggle");

          if ( previousToggle ) {
            previousToggle.focus();
          }

          event.stop();

          break;
          
        case Event.KEY_LEFT:
          
          // if the section is open, close it
          if ( sectionContent.visible() ) {
            globalNavMenu.closeSection( sectionContent );
          }

          // otherwise, focus the first section in the rail
          else {
            globalNavMenu.focusFirstShortcut();
          }

          event.stop();

          break;
          
      }

    });
                
  });

},
  /**
   * Hide/show the menu.
   *
   * @param show Whether to hide or show the menu.
   */
  toggleMenu: function ( show, preview )
  {
    
    var menu = $("global-nav-flyout");
    var menuLink = $("global-nav-link");
    var menuImage = $("global-toggle-img");

    var isPreview = preview && "true" === preview;
    
    // if the caller didn't express a preference, toggle the menu display 
    if ( show === undefined )
    {
      show = !menu.visible();
    }
    
    if ( show && !menu.visible() )
    {
      if ( $( "ftueTooltip" ) ) $( "ftueTooltip" ).remove();

      menuLink.addClassName("active");
      menu.show();

      menuImage.setAttribute( 'src', getCdnURL( '/images/ci/mybb/arrowUp-topnav.png' ) );
      menuImage.setAttribute( 'alt', page.bundle.getString( "globalnav.menu.collapse" ) );

      if ( !isPreview )
      {
        UserDataDWRFacade.getStringTempScope( globalNavMenu.ACTIVE_SECTION_KEY, globalNavMenu.handleActiveSection );
        globalNavMenu.resizeMenu();
      }
      
      // this is an awful hack. it's here because (a) the event that open the menu goes on to steal any focus we try to apply
      // when the menu opens; and (b) we can't stop the event because it's used to trigger the display of the welcome overlay.
      // bah.
      setTimeout(globalNavMenu.focusFirstShortcut, 200);
      
    }

    else if ( menu.visible() )
    {
      if ( $('global-more-tools') && $('global-more-tools').visible() )
      {
        $('global-more-tools').hide();
      }

      menuLink.removeClassName("active");
      menu.hide();

      menuImage.setAttribute( 'src', getCdnURL( '/images/ci/mybb/arrowDown-topnav.png' ) );
      menuImage.setAttribute( 'alt',page.bundle.getString( "globalnav.menu.expand" ) );
    }

  },

  /**
   * Called when the menu link is clicked.
   */
  onNavLinkClick : function( event ) 
  { 
    if( !$("flyoutMenuContent") )
    {
      new Ajax.Request( "/webapps/portal/execute/globalNavFlyout?cmd=view",
                        {  method: 'get',
                           asynchronous: false,         
                           onSuccess: function(transport) {
                             var result = transport.responseText;
                             if ( result ) 
                             {
                               $("global-nav-flyout").insert( {top:result} );
                               window.tool_service.getActivityData( true ); /* the user manually clicked the dropdown, lets refresh the values for them just in case */
                               globalNavMenu.attachEventHandlersInsideFlyout();
                             }
                           }
                        });
    }

    var preview = $("global-nav").readAttribute("data-preview") ;

    // no need to check if there's a user in the context when in preview
    if ( "true" === preview )
    {
      globalNavMenu.toggleMenu ( !$("global-nav-flyout").visible(), preview );
    }
    else
    {
      UserDWRFacade.isUserFoundInContext(function( isUserFoundInContext ) 
      {
        if (isUserFoundInContext) 
        {
          globalNavMenu.toggleMenu ( !$("global-nav-flyout").visible(), preview );
        } 
        else 
        {
          // the user is not found in the context when a logout was triggered in another tab; 
          // reloading the current location will trigger a re-login flow preserving 
          // the current frameset tab group as the final destination, also we want to force 
          // a trip to the server rather than using the browser's cache
          window.location.reload(true);
        }
      });
    }

    // note: we would like to stop propagation of this event -- it causes us focus issues -- but we
    // can't, because it's needed for the welcome menu overlay
    
    // need to prevent page jumping behavior on preview pages
    // tried javascript:void(0), href="globalNavMenu.onNavLinkClick()" but they either don't work or mess up menu closer
    // on some browsers. event propagation is needed on real menu. hence hack.
    if ( "true" === preview )
    {
      Event.stop( event );
    }
    else if ( event.preventDefault )
    {
      event.preventDefault();
    }

    if (window.matchMedia("(max-width: 736px)").matches) {
      globalNavMenu.mobileGlobalNavHandling();
    }
  },

  
  resizeMenu : function()
  {
    var winHeight = document.viewport.getHeight();

    var nav = $('global-nav-flyout');
    var navOffset = nav.viewportOffset().top;

    // new height of the entire global nav - min( 600px, the height of the viewport - offset )
    var newHeight = 600;
    if ( newHeight > winHeight - navOffset )
    {
      newHeight = winHeight - navOffset;
    }
    nav.setStyle( { height: newHeight +'px' } );

    // the height of all of the toggles + the bottomButtons
    var totalToggleHeight = $('bottomButtons' ).getHeight();
    $$('#vertical_container > .accordion_toggle').each(function(e){
      if ( newHeight > totalToggleHeight + e.getHeight() )
      {
        totalToggleHeight += e.getHeight();
      }
    });

    // the height of the accordion content sections (this affects the height of the global nav)
    // set the accordions to fit in the remaining space
    var accordionContentHeight = newHeight - totalToggleHeight + "px";
    $$('#vertical_container > .accordion_content').invoke('setStyle', { height: accordionContentHeight });

    // resize the sideNav
    globalNavMenu.resizeRail();
  },

  resizeRail : function()
  {
    // if window has been resized with non empty more tools box, we need to redraw the box according to new viewport size
    // so move all shortcuts out back to shortcut list first to start over
    if ( $$('#global-more-tools > li').size() > 0 )
    {
      $$('#global-more-tools > li').each( function( shortcut )
      {
        $('global-more-link').insert( { before : shortcut } );
      });
    }

    var shortcuts = $$('#global-list-tools > li');
    // more link is always hidden
    if ( shortcuts && shortcuts.length > 1 )
    {
      var globalHeight = $('global-nav-flyout').getHeight();
      var listHeight = $('global-list-tools').getHeight();

      //if the sidenav is larger than the menu
      if( listHeight > globalHeight)
      {
        //resize the sidenav
        $('global-nav-tools').setStyle( { height : globalHeight +'px'});
        $('global-more-link').show();

        // start from the second to last list item (this avoids the More link, which is the last item in the list)
        // if the tools menu is larger than the global nav, insert the items that overflow into a separate list
        // a while loop? are you kidding? somebody save me from myself.

        var i = shortcuts.size()-2;
        while ( listHeight > globalHeight && i >= 0 )
        {
          // move one shortcut to more box then remeasure sidenav height
          $( 'global-more-tools' ).insert( { top: shortcuts[i] } );
          listHeight = $('global-list-tools').getHeight();
          i--;
        }
      }

      if( $$('#global-more-tools > li').size() === 0 )
      {
        $('global-more-link').hide();
      }
    }
  },

  drawMoreBox : function()
  {
    // need to show it first to get heights
    var more = $('global-more-tools');
    more.show();

    var items = $$('#global-more-tools > li').size();
    var gridSize = Math.sqrt(items);
    gridSize = Math.ceil(gridSize);

    var item = $$('#global-more-tools li')[0];
    var itemHeight = item.getHeight() + item.style.paddingTop + item.style.paddingBottom;
    gridSize *= itemHeight;

    more.setStyle({height: gridSize +'px', width: gridSize +'px'});
  },

  onMoreClick : function( event )
  {
    var e = event || window.event;
    var eventElement = Event.element( e );

    if ( eventElement.up( '.more-link' ) )
    {
      var moreToolsBox = $('global-more-tools');
      if ( !moreToolsBox.visible() )
      {
        globalNavMenu.drawMoreBox();
      }
      else
      {
        moreToolsBox.hide();
      }
    }

    eventElement.up().toggleClassName( 'active' );

    return false;
  },

  onShortcutClick : function( event )
  {

    var e = event || window.event;
    Event.stop( e );

    globalNavMenu.toggleMenu ( false );
    location = this.href;
    return false;

  },

  onSectionClick : function( event )
  {
    var e = event || window.event;
    Event.stop( e );

    var contentArea = this.down();

    var sectionId = contentArea.readAttribute( "data-section-id" );
    var sectionUri = contentArea.readAttribute( "data-section-uri" );

    var sectionContentDiv = $(sectionId+'-content');

    if ( sectionContentDiv.visible() )
    {
      globalNavMenu.closeSection ( sectionContentDiv );
    }
    else
    {
      globalNavMenu.openSection ( sectionContentDiv, sectionUri );
    }
    globalNavMenu.saveActiveSection();
    return false;
  },

  closeSection: function ( sectionContentDiv )
  {
    var allowCaching = "true" === sectionContentDiv.readAttribute( "data-allow-caching" );

    if ( sectionContentDiv.visible() )
    {
      // no caching allowed - wipe out contents
      if ( !allowCaching )
      {
        sectionContentDiv.innerHTML = "";
      }

      sectionContentDiv.setAttribute( 'aria-hidden', 'true' );

      sectionContentDiv.hide();

      var sectionId = sectionContentDiv.getAttribute('id').replace('-content', '');
      $(sectionId + '-title').setAttribute('aria-expanded', 'false');

    }
  },

  openSection: function ( sectionContentDiv, sectionUri )
  {
    $$('.accordion_content').each( function( s ){
      globalNavMenu.closeSection( s );
    });


    var allowCaching = "true" === sectionContentDiv.readAttribute( "data-allow-caching" );

    sectionContentDiv.setAttribute( 'aria-hidden', 'false' );

    
    if ( !allowCaching || sectionContentDiv.empty() )
    {
      sectionContentDiv.addClassName("section-loading");
      sectionContentDiv.show();

      new Ajax.Request( sectionUri,
                        {  method: 'get',
                           asynchronous: true,
                           
                           onSuccess: function(transport) {
                             var result = transport.responseText;
                             if ( result ) {
                               sectionContentDiv.insert( { top: result } );
                               globalNavMenu.attachSectionContentEventHandlers (sectionContentDiv);
                               globalNavMenu.focusFirstSectionLink(sectionContentDiv);
                             }

                             sectionContentDiv.removeClassName("section-loading");
                           }
                        });
    }
        
    else
    {
      sectionContentDiv.show();
    }

    var sectionId = sectionContentDiv.getAttribute('id').replace('-content', '');
    $(sectionId + '-title').setAttribute('aria-expanded', 'true');
  },

  
  attachSectionContentEventHandlers: function(sectionContent) {
  
    // TBD I wonder whether we should be doing this at the menu level; or, rather, whether
    // we should be doing it more generically
    sectionContent.select("a").each ( function (anchor) {
      
      anchor.observe( "keydown", function(event)  {
        
        var key = event.keyCode;
  
        var accordionContentContainer = this.up(".accordion_content");
  
        if (key === Event.KEY_LEFT ) {
            var sectionId = accordionContentContainer.readAttribute("data-section-id");
  
            // close the accordion section and put focus on the toggle
            globalNavMenu.closeSection( $(sectionId + "-content") );
            accordionContentContainer.previous().focus();
            event.stop();
        }
        
      });
      
    });
    
  },
  
  handleActiveSection : function( sectionId )
  {
    var sectionContentDiv = $(sectionId+"-content");
    if ( sectionId.blank() || !sectionContentDiv )
    {
      sectionContentDiv = $$("div.accordion_content").first();
    }

    var sectionUri = sectionContentDiv.readAttribute("data-section-uri");

    globalNavMenu.openSection( sectionContentDiv, sectionUri );
  },

  saveActiveSection : function()
  {
    var activeSectionId = null;
    $$('.accordion_content').each( function( s ){
      if ( s.visible() )
      {
        activeSectionId = s.readAttribute("data-section-id");
        return;
      }
    });

    if ( activeSectionId )
    {
      UserDataDWRFacade.setStringTempScope( globalNavMenu.ACTIVE_SECTION_KEY, activeSectionId );
    }
    else
    {
      UserDataDWRFacade.removeStringTempScope( globalNavMenu.ACTIVE_SECTION_KEY );
    }
  },

  updateTotalCount : function () {

    var total = window.tool_service.getActivityCounts().values().inject( 0, function ( acc, count ) {
      return acc + count;
    });

    var globalAvatar = $("global-avatar");

    // display the total, or hide the badge, depending on whether we have any activity
    if ( total > 0 )  {

      var badgeTotalElement = $("badgeTotal");
      var badgeCountElement = $("badgeTotalCount");

      // update the badge
      var badgeValue = window.tool_service.formatCount(total, window.tool_service.MAX_COUNT);
      badgeCountElement.innerHTML = badgeValue;
      badgeTotalElement.setStyle( { visibility : 'visible'} );

    }

    else  {

      $("badgeTotal").setStyle( { visibility : 'hidden'} );

    }

  },


  activityListener : {

    activityCountsUpdated : function () {

      if ( window.tool_service.getActivityCounts() ) {

        window.tool_service.getActivityCounts().each ( function ( pair ) {


          // if the tool has any activity, display its badge
          if  ( pair.value > 0 ) {
            globalNavMenu.showToolActivityValue( pair.key, pair.value );
          }

          // ... otherwise hide it
          else {
            globalNavMenu.removeToolActivityValue( pair.key );
          }

        });

        globalNavMenu.updateTotalCount();

      }

      else {
        $("badgeTotal").setStyle( { visibility : 'hidden'} );
      }

    },

    activityCountUpdated : function ( toolId ) {

      var badgeValue = window.tool_service.getActivityCountForTool(toolId);

      if ( badgeValue && badgeValue > 0 ) {
        globalNavMenu.showToolActivityValue( toolId, badgeValue );
      }

      else {
        globalNavMenu.removeToolActivityValue( toolId );
      }

      globalNavMenu.updateTotalCount();

    }

  },

  // used by course section : course_menu_section.jsp
  goToUrl: function( targetUrl )
  {

    // hide the menu
    globalNavMenu.toggleMenu( false );

    // replace the entire page
    window.top.location.href = targetUrl;
    return false;
  },


  /**
   * Inserts the tool activity value in the badge element.
   *
   * @param toolId         The tool whose activity count we're updating
   * @param activityCount  The activity count
   */
  showToolActivityValue: function( toolId, activityCount ) {

    var badge = $(toolId + "::badge");

    // update the badge
    if ( badge ) {

      var badgeValue = window.tool_service.formatCount(activityCount, window.tool_service.MAX_TOOL_COUNT);
      badge.innerHTML = badgeValue;
      badge.show();

      // update hidden screen reader label to include activity data      
      var shortcut = $(toolId + "_AXLabel");
      if ( shortcut )
      {
    	shortcut.innerHTML = shortcut.getAttribute("data-tool-title") + " - " + page.bundle.getString("tool.activity.description");
      }
    }

  },

  /**
   * Removes tool actvity values from the UI.
   *
   * @param The tool whose activity count we're updating.
   */
  removeToolActivityValue: function( toolId ) {

    var badge = $(toolId + "::badge");

    if ( badge ) {
      badge.innerHTML = ""; // necessary to prevent JAWS/IE from announcing the value, even when it's hidden: known issue with JAWS and hidden <spans> inside <a> tags
      badge.hide();
      
      // wipe out screen reader label
      var shortcut = $(toolId + "_AXLabel");
      if ( shortcut )
      {
        shortcut.innerHTML = "";
      }
    }

  },
  

  focusFirstShortcut: function() {

    var firstShortcut = $$(".mybb-tools a:first").first();

    if ( firstShortcut ) {
      try 
      {
        firstShortcut.focus();
      } 
      catch (e)
      {
        // Ignore - in IE you cannot set focus on an element that isn't visible and this may not be visible right now.
        // TODO: investigate why we are trying to focus on a not-visible element.
      }
    }

  },


  focusFirstSectionLink: function ( container ) {
    
    // next try to focus on the first non-hidden link
    var links = container.select ("a[class!='hideoff']" );
    
    if ( links && links.length > 0 ) {
      $( links[ 0 ] ).focus();
    }
    
  },
  
  
  keyboardCloseMenu: function() {

    // temporarily suppress the on-focus-open behavior of IE, because we don't want the menu to pop
    // back open as soon as it's closed
    if ( Prototype.Browser.IE ) {
      $("global-nav-link").stopObserving( "focus", globalNavMenu.onNavLinkClick );
    }
    
    globalNavMenu.toggleMenu(false);
    $("global-nav-link").focus();

    // re-instate on-focus-open
    if ( Prototype.Browser.IE ) {
      window.setTimeout ( function() { $("global-nav-link").observe( "focus", globalNavMenu.onNavLinkClick ); }, 50 );
    }
    
  },
  
  preventDefault: function() 
  {
    event.returnValue = false;
    if ($("global-nav-flyout").visible())
    {
      $("global-nav-link").blur();
    }
  },


  //jquery for mobile menu modifications.  Currently only called when display is under 1038px

  mobileMenuMods : function () 
  {
    //pull down new learn mobile nav
    //This Will ensure that we remove any onClick handlers that are on the
    // hamburger menu before we add another. Having two or any even number for
    // that matter would mean when you clicked on the menu it would fire an
    // even amount of times (expand then collapse) which would show no action on click.
    $j(".global-nav-bar-wrap-mobile-nav").find(".hamburger").off( "click" ).on("click", function(){
      if ( $( "ftueTooltip" ) ) $( "ftueTooltip" ).remove();
      $j("#globalNavPageNavArea").toggleClass("main-nav-open");
      $j(this).toggleClass("is-active"); 
      $j(".appTabs td").show();
    });

    if ($j("body").hasClass("mybb-shell")) {
      $j(".appTabs td:first-of-type").addClass("active");
    }


    //slide sidebar of goals and assesments similar to course menu
    if ($j("#goals-tool-list") || $j(".portfolioLeftPage")) {
      $j("#globalNavPageContentArea").on("click", "#goals-tool-list",  function () {
          if (this.hasClassName("tools-list-open")) {
          this.removeClassName("tools-list-open");
        } else {
          this.addClassName("tools-list-open");
        }
      });

      $j("#globalNavPageContentArea").on("click", ".portfolioLeftPage",  function () {
          if (this.hasClassName("tools-list-open")) {
          this.removeClassName("tools-list-open");
        } else {
          this.addClassName("tools-list-open");
        }
      });
    }

    var paneTabs = $j("#paneTabs").detach();
    $j(".appTabs td.active").append(paneTabs);

    var mybbnav = $j("#global-nav").detach();
    $j(mybbnav).insertAfter("#appTabList td:last-of-type");

    if ( $( "ftueTooltip" ) ) {
      var ftueTooltip = $j( "#ftueTooltip" ).detach();
      $j( ".global-nav-bar-wrap-mobile-nav" ).prepend( ftueTooltip );
    }
  },

  reverseMobileMenuMods : function()
  {
    //rollback mobile menu changes fired at below 1038px, replaces moved elements and removes some click handlers
    //The original condition statement --$j(".appTabs").find("#global-nav").length-- works to revert the mobile mode only for
    //Registered users because the #global-nav is only created for that type of user. But the HTML structure for
    //both users is very similar: They do have an element which class is appTabs. Thus in order this function reverts
    //mobile mods for guest user and for registered users, the conditions only must be --$j(".appTabs").length--
    if ( $j(".appTabs").length )
    {

      $j(".global-nav-bar-wrap-mobile-nav").find(".hamburger").off("click", function(){
        if ( $( "ftueTooltip" ) ) $( "ftueTooltip" ).remove();
        $j("#globalNavPageNavArea").toggleClass("main-nav-open");
        $j(this).toggleClass("is-active");
        $j(".appTabs td").show();
      });

          //slide sidebar of goals and assesments similar to course menu
      if ($j("#goals-tool-list") || $j(".portfolioLeftPage")) {
        $j("#globalNavPageContentArea").off("click", "#goals-tool-list",  function () {
            if (this.hasClassName("tools-list-open")) {
            this.removeClassName("tools-list-open");
          } else {
            this.addClassName("tools-list-open");
          }
        });

        $j("#globalNavPageContentArea").off("click", ".portfolioLeftPage",  function () {
            if (this.hasClassName("tools-list-open")) {
            this.removeClassName("tools-list-open");
          } else {
            this.addClassName("tools-list-open");
          }
        });
      }

      var paneTabs = $j("#paneTabs").detach();
      $j(".paneTabs").append(paneTabs);

      var mybbnav = $j("#global-nav").detach();
      $j(mybbnav).insertAfter(".global-nav-bar.logout");

      if ( $( "ftueTooltip" ) ) {
        var ftueTooltip = $j( "#ftueTooltip" ).detach();
        $j( "#global-nav" ).append( ftueTooltip );
      }

    }
  },

  mobileGlobalNavHandling : function() 
  {
    $j(".appTabs td").hide();
  },
  
};
