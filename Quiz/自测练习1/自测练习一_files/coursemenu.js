var courseMenu = {};

courseMenu.Util = {};

courseMenu.Util.getTocItemTemplate = function( type, isHidden, isEmpty, menuGeneratorUrl )
{
    var template = '';
    var url = ( menuGeneratorUrl ) ? menuGeneratorUrl : '/webapps/blackboard/execute/getCourseMenuContextMenu';
    var closeStr = page.bundle.getString("closeStr");
    var moreOptionsStr = page.bundle.getString("moreOptionsStr");
    var reorderSpan = '<span class="reorder editmode"><span><img src="' + getCdnURL( "/images/ci/icons/generic_updown.gif" ) + '" alt="" /></span></span>';
    var contextMenuTemplate =
      "<span class='contextMenuContainer' bb:menuGeneratorURL='" + url + "' bb:contextParameters='course_id=<&= courseId &>&toc_id=<&= id &>'>" +
      "<a class='cmimg editmode' href='#contextMenu' title='" + moreOptionsStr + "'><img src='" + getCdnURL( "/images/ci/icons/cm_arrow.gif" ) + "' alt='" + moreOptionsStr + "'></a> " +
      "<div id='menudiv' class='cmdiv' style='display:none;'> "+
       "<ul><li class='contextmenubar_top'><a title='" + closeStr + "' href='#close'><img alt='" + closeStr + "' src='" + getCdnURL( "/images/ci/ng/close_mini.gif" ) + "'></a></li></ul></div></span>";

    if ( type == 'DIVIDER' )
    {
      template = "<li class='divider' id='paletteItem:<&= id &>'>"+reorderSpan+"<hr>";
    }
    else if ( type == 'SUBHEADER' )
    {
      template = "<li class='subhead' id='paletteItem:<&= id &>'>"+reorderSpan+"<h3><span><&= name &></span></h3>";
    }
    else
    {
      var liClass = (isHidden || isEmpty) ? 'clearfix invisible editmode' : 'clearfix';
      template = "<li id='paletteItem:<&= id &>' class='"+ liClass +"'>"+reorderSpan;
       if (type == 'URL')
       {
         template += "<a onClick=\"this.href='<&= href &>';\" href='<&= url &>' target='<&= target &>' id='label:<&= id &>'><span title='<&= name &>'><&= name &></span>";
       }
       else
       {
         template += "<a href='<&= href &>' target='<&= target &>' id='label:<&= id &>'><span title='<&= name &>'><&= name &></span>";
       }

      if ( isHidden )
      {
        var hiddenStr = page.bundle.getString("hiddenStr");
        template += "<span class='cmLink-hidden' title='" + hiddenStr + "'><img src='" + getCdnURL( "/images/spacer.gif" ) + "' alt='" + hiddenStr + "'/></span>";
      }
      if ( isEmpty )
      {
        var emptyStr = page.bundle.getString("emptyStr");
        template += "<span class='cmLink-empty' title='" + emptyStr + "'><img src='" + getCdnURL( "/images/spacer.gif" ) + "' alt='" + emptyStr + "'/></span>";
      }
      template += "</a>";
    }
    return template + contextMenuTemplate;
};

/**
 * Controls the dynamic course menu behaviour.
 */
courseMenu.CourseMenu = Class.create();
courseMenu.CourseMenu.prototype =
{
  initialize: function( menuActionUrl, menuGeneratorUrl )
  {
    this.menuActionUrl = '/webapps/blackboard/execute/doCourseMenuAction';
    if( menuActionUrl )
    {
      this.menuActionUrl= menuActionUrl;
    }

    this.menuGeneratorUrl = '/webapps/blackboard/execute/getCourseMenuContextMenu';
    if( menuGeneratorUrl )
    {
      this.menuGeneratorUrl = menuGeneratorUrl;
    }
    var addButton = $('addCmItem'); // open the flyout form relative to this element
    this.editMode = false;
    if ( addButton )
    {
        this.editMode = true;
      var addNewMenuItemFunc = this._addNewMenuItem.bind( this );
      var afterModifyItemFunc = this._afterModifyItem.bind( this );

      if( $('pickerLink') )
      {
        Event.observe( 'pickerLink', 'click', this._showCourseLinkPicker.bindAsEventListener( this ) );
      }

      if( $('modifyCourseLinkPickerLink') )
      {
        Event.observe( 'modifyCourseLinkPickerLink', 'click', this._showModifyCourseLinkPicker.bindAsEventListener( this ) );
      }

        var addButtonLink = $(addButton.getElementsByTagName('a')[0]);

    // Initialize flyout forms
    new flyoutform.FlyoutForm({  linkId:'addContentAreaButton',
                  formDivId:'addContentAreaForm',
                  openRelativeItem:addButton,
                  customPostSubmitHandler:addNewMenuItemFunc,
                  onCloseFocusItem:addButtonLink });

    // Initialize flyout forms
    if ( $s('addBlankPageButton') )
    {
      new flyoutform.FlyoutForm({  linkId:'addBlankPageButton',
                    formDivId:'addBlankPageForm',
                    openRelativeItem:addButton,
                    customPostSubmitHandler:addNewMenuItemFunc,
                    onCloseFocusItem:addButtonLink });
    }

    new flyoutform.FlyoutForm({  linkId:'addToolLinkButton',
                  formDivId:'addToolLinkForm',
                  openRelativeItem:addButton,
                  customPostSubmitHandler:addNewMenuItemFunc,
                  onCloseFocusItem:addButtonLink });

    if( $('addToolLinkButton') )
    {
      Event.observe( 'addToolLinkButton', 'click', function()
      {
        setTimeout( function()
        {
          var toolSelect = $('toolSelect');
          if ( toolSelect )
          {
            // dynamically load the tool select if not already done
              if ( toolSelect.length === 0)
            {
                CourseMenuDWRFacade.getCourseTools( window.course_id, function( tools )
              {
                dwr.util.addOptions( "toolSelect", tools);
              });
            }
            toolSelect.selectedIndex = 0;
          }
        }, 100); // wait for the flyout to open before loading
      });
    }

    if ( $s('addCourseLinkButton' ) )
    {
      new flyoutform.FlyoutForm({  linkId:'addCourseLinkButton',
                    formDivId:'addCourseLinkForm',
                    openRelativeItem:addButton,
                    customPostSubmitHandler:addNewMenuItemFunc,
                    onCloseFocusItem:addButtonLink });
    }
    if ( $s('addExternalLinkButton' ) )
    {
      new flyoutform.FlyoutForm({  linkId:'addExternalLinkButton',
                    formDivId:'addExternalLinkForm',
                    openRelativeItem:addButton,
                    customPostSubmitHandler:addNewMenuItemFunc,
                    onCloseFocusItem:addButtonLink });
    }
    if ( $s('addModulePageButton' ) )
    {
      new flyoutform.FlyoutForm({  linkId:'addModulePageButton',
                    formDivId:'addModulePageForm',
                    openRelativeItem:addButton,
                    customPostSubmitHandler:addNewMenuItemFunc,
                    onCloseFocusItem:addButtonLink });
    }

    new flyoutform.FlyoutForm({  linkId:'addSubHeaderButton',
                  formDivId:'addSubheaderForm',
                  openRelativeItem:addButton,
                  customPostSubmitHandler:addNewMenuItemFunc,
                  onCloseFocusItem:addButtonLink });

    new flyoutform.FlyoutForm({  formDivId:'addDividerForm',
                  customPostSubmitHandler:addNewMenuItemFunc,
                  onCloseFocusItem:addButtonLink });

    // when adding dividers, no need show form, just submit it
    if( $('addDividerButton') )
    {
      Event.observe( 'addDividerButton', 'click', function()
        {
          flyoutform.flyoutForms.addDividerForm.submit();
        });
      }

    // opening of modify... flyout forms is handled via context menu rather than button
    new flyoutform.FlyoutForm({  formDivId:'modifyCourseLinkForm',
                  resetFormOnOpen:false,
                  customPostSubmitHandler:null});

    new flyoutform.FlyoutForm({  formDivId:'modifyExternalLinkForm',
                  resetFormOnOpen:false,
                  customPostSubmitHandler:this._afterModifyExternalLinkItem.bind( this ) });

    }
  // Hack for Safari for links in a new window
    if ( window.inNewWindow )
    {
      this.inNewWindow = true;
      $A(document.getElementsByTagName('a')).each( function( item )
      {
        // This is never going to happen because the frame removal project removed all instances of target="content"
        if ( item.target == 'content' )
        {
          Event.observe(item, "click", this._targetParentWindow.bindAsEventListener( this, item ));
        }
      }.bind(this));
    }
    else
    {
      this.inNewWindow = false;
    }

  this.courseMapLink = $('courseMapButton');
  if ( this.courseMapLink )
  {
    Event.observe( this.courseMapLink, 'click', this._showCourseMenuInWindow.bindAsEventListener( this ));
  }

    this.quickViewLink = $('quickViewLink');
    this.quickViewContainer = $('courseMenuPalette_contents');
    if ( this.quickViewLink )
    {
      Event.observe( this.quickViewLink, 'click', this._showQuickView.bindAsEventListener( this ) );
    }

  this.expandAllLink = $('expandAllLink');
  this.collapseAllLink = $('collapseAllLink');
  if ( this.expandAllLink && this.collapseAllLink )
  {
	Event.observe( this.expandAllLink, 'click', this._detailViewExpandAll.bindAsEventListener( this ) );
	Event.observe( this.collapseAllLink, 'click', this._detailViewCollapseAll.bindAsEventListener( this ) );
    var courseMenuDivs = $('courseMenuPalette').getElementsByTagName('div');
    var courseMenuContents = null;
    for ( var i = 0; i < courseMenuDivs.length; i++ )
    {
      if ( page.util.hasClassName( courseMenuDivs[i], 'navPaletteContent') )
      {
        courseMenuContents = $(courseMenuDivs[i]);
      }
    }
    this.detailViewContainer = new Element("div", { id: 'courseMenu_folderView',style: 'display: none;' }).addClassName('treeContainer');
    courseMenuContents.appendChild(this.detailViewContainer);
    this.tree = null;
    $(this.collapseAllLink.getElementsByTagName('a')[0]).addClassName('options');
    this._showDetailView();
  }

  this.refreshLink = $('refreshMenuLink');
  if ( this.refreshLink )
  {
    Event.observe( this.refreshLink, 'click', this._refreshMenu.bindAsEventListener(this) );
  }

  this.quickEnrollLink = $('quickEnrollLink');
  if ( this.quickEnrollLink)
  {
    Event.observe( this.quickEnrollLink, 'click', this._quickEnrollToggle.bindAsEventListener(this) );
  }

  this.quickGuestEnrollLink = $('quickGuestEnrollLink');
  if ( this.quickGuestEnrollLink)
  {
    Event.observe( this.quickGuestEnrollLink, 'click', this._guestEnrollToggle.bindAsEventListener(this) );
  }

  var renameSubHeaderInputBox = $("renameSubHeaderInputBox");
  if ( renameSubHeaderInputBox )
  {
    Event.observe( renameSubHeaderInputBox, "keydown", this.onKeyDown.bindAsEventListener( this ) );
  }

  var renameSubHeaderForm = $('renameSubHeaderForm');
  if ( renameSubHeaderForm )
  {
      renameSubHeaderForm.remove();
      document.body.appendChild( renameSubHeaderForm );
    }

  this.initPaletteState();
  this._updateSubheaders();
  },

  /**
   * Update the appearance of subheader names in the accessible drag and drop window
   * for course menu toc reordering to "Subheader: [subheader_name]".
   * And, of course, this applies in course menu edit mode only.
   */
  _updateSubheaders: function( )
  {
    if( this.editMode )
    {
      var firstTocItem = $( 'courseMenuPalette_contents' ).down( 'li' );
      var hideReorderBtn = !firstTocItem.readAttribute( 'id' );// prototype bug with IE7
      // create a map of option values to options
      var optionMap = {};
      dragdrop.ListReordering.addDivs();

      var sel = $('courseMenuPalette_pageListReorderControlSelect');
      $A(sel.options).each( function( o )
      {
        optionMap[o.value] = o;
      });
      dragdrop.ListReordering.removeDivs();
      var lst = $('courseMenuPalette_contents');
      $A(lst.getElementsByTagName("li")).each( function( listItem )
      {
        if ( $(listItem).hasClassName('subhead') )
        {
          // isolate id (after last colon)
          var id = listItem.id;
          id = id.substr( id.lastIndexOf(':') + 1 );
          var option = optionMap[id];
          // prepend "Subheader: " to option label
          $(option).update( page.bundle.getString("subheaderColonStr", option.innerHTML) );
        }
      });
      if( hideReorderBtn )
      {
        $( 'courseMenuPalette_reorderControlLink' ).up( 'li' ).hide();
      }
    }
  },

  _targetParentWindow: function( event, item )
  {
    Event.stop( event );
    window.opener.top.content.location = item.href;
  },

  /**
   * Enters initial prompt workflow for top-level coures toc removal.
   */
  deleteItem: function( toc_id )
  {
    var viewUrl = this.appendMenuActionUrl( 'cmd=deleteContentArea&course_id='+course_id+'&toc_id='+toc_id );
    this.DeleteItemBox = new lightbox.Lightbox(
      {
        focusOnClose : $( 'paletteItem:' + toc_id ),
        showCloseLink : false,
        closeOnBodyClick : false,
        dimensions :
        {
          w : 400,
          h : 280
        },
        ajax :
        {
          url : viewUrl
        }
      } );
    this.DeleteItemBox.open();
  },

  /**
   * Secondary confirmation for deletion including report of children if any exist.
   */
  deleteItemConfirmation: function( toc_id )
  {
    var viewUrl = this.appendMenuActionUrl( 'cmd=deleteContentAreaConfirmation&course_id='+course_id+'&toc_id='+toc_id );
    courseMenu.DeleteItemBox = new lightbox.Lightbox(
      {
        focusOnClose : $( 'paletteItem:' + toc_id ),
        showCloseLink : false,
        closeOnBodyClick : false,
        dimensions :
        {
          w : 400,
          h : 280
        },
        ajax :
        {
          url : viewUrl
        }
      } );
    courseMenu.DeleteItemBox.open();
    return false;
  },

  /**
   * Closes confirmation lightboxes.  Successive open of lightboxes caused the de factor lightbox closure
   * to exhibit failing behavior.
   */
  closeConfirmation: function()
  {
    if (courseMenu.DeleteItemBox)
      courseMenu.DeleteItemBox.close();
    else
      lightbox.closeCurrentLightbox();
  },

  /**
   * Deletes a course menu item for the given item (toc) id
   *   Prompts the user for confirmation before deleting
   *  Calls the server to remove the Toc
   *  The current doc location is sent as a retUrl param to allow reloading the current
   *    page after deleting the item.
   */
   removeToc: function( toc_id )
   {
     var retUrl = escape(document.location.href);
     new Ajax.Request(this.appendMenuActionUrl( 'cmd=removeToc&course_id='+course_id+'&toc_id='+toc_id+ '&retUrl=' + retUrl + '&' + courseMenu.nonceKey + '=' + courseMenu.nonceValue ),
     {
      //the onLoaded function has been added to close the DeleteItemBox once the request has been submitted, so that user does not click the Delete button again.
       onLoaded: function()
       {
          courseMenu.CourseMenu.prototype.closeConfirmation();
       },
       onSuccess: function(transport, json)
       {
         var result = transport.responseText.evalJSON( true );
         if ( result.success == "true" )
         {
           window.location = result.refreshUrl;
         }
         else
         {
            new page.InlineConfirmation("error", result.errorMessage, false );
         }
       }
       } );
   },

   /**
    * Hides toc item without additional confirmation steps.
    * Workflow steps handle confirmation via lightboxes.
    */
   hideItem: function( toc_id )
  {
    var url = this.appendMenuActionUrl( "cmd=hideTocItem&course_id="+course_id+"&toc_id="+toc_id+"&retUrl="+escape(document.location.href) );
    window.location.href = url;
  },

  toggleItemAvailability: function( toc_id, isEntryPoint )
  {
    var changeEntryPont = true;
    if ( isEntryPoint )
    {
      var entryPointChangeConfirmStr = page.bundle.getString("entryPointChangeConfirmStr");
      changeEntryPont = confirm ( entryPointChangeConfirmStr );
    }
    if(  changeEntryPont )
    {
      var url = this.appendMenuActionUrl( "cmd=toggleTocAvailability&course_id="+course_id+"&toc_id="+toc_id+"&retUrl="+escape(document.location.href) );
      window.location.href = url;
    }
  },

  modifyCourseLink: function( toc_id )
  {
    var courseLinkId = 'paletteItem:' + toc_id;
    var url = this.appendMenuActionUrl( 'cmd=getCourseLinkTitle&course_id='+window.course_id+'&toc_id='+toc_id );
    new Ajax.Request( url, {
    onSuccess: function(transport, json) {
      var result = transport.responseText.evalJSON( true );
      if ( result.success == "true" )
      {
        flyoutform.flyoutForms.modifyCourseLinkForm.open( $(courseLinkId).down('a') );
        $s('modifiedLinkLocation').value = result.linkLocation;
        $s('modifyCourseLinkFormTocId').value = toc_id;
        $s('modifiedLinkId').value = result.linkedItemId;
        $s('modifiedLinkType').value = result.linkedItemType;
      }
     else
     {
       new page.InlineConfirmation("error", result.errorMessage, false );
     }
    }
  });
  },

  modifyExternalLink: function( toc_id )
  {
    var externalLinkId = 'paletteItem:' + toc_id;
    var url = this.appendMenuActionUrl( 'cmd=getExternalLinkUrl&course_id='+window.course_id+'&toc_id='+toc_id );
    new Ajax.Request( url, {
    onSuccess: function(transport, json) {
      var result = transport.responseText.evalJSON( true );
      if ( result.success == "true" )
      {
        flyoutform.flyoutForms.modifyExternalLinkForm.open( $(externalLinkId).down('a') );
        $s('modifyExternalLinkFormTocId').value = toc_id;
        $s('externalLinkUrlInputId').value = result.linkUrl;
      }
     else
     {
       new page.InlineConfirmation("error", result.errorMessage, false );
     }
    }
  });
  },

  toggleItemLaunchInd: function( toc_id )
  {
    var tocId = 'paletteItem:' + toc_id;
    var cmItem = $('toggleTocLaunchIndex:' + toc_id);
    var url = this.appendMenuActionUrl( 'cmd=toggleTocLaunchIndex&course_id='+window.course_id+'&toc_id='+toc_id );
    new Ajax.Request( url, {
    onSuccess: function(transport, json) {
      var result = transport.responseText.evalJSON( true );
      if ( result.success == "true" )
      {
        var tocLink = $(tocId).down('a');
        tocLink.target = result.windowType;
        tocLink.href = result.href;
        cmItem.innerHTML = result.menuItem;
        if ( result.warning )
        {
          new page.InlineConfirmation("warning", result.warning, false );
        }
      }
     else
     {
       new page.InlineConfirmation("error", result.errorMessage, false );
     }
    }
  });
  },

  submitRequestAsPost: function( action, toc_id )
  {
    // generate a form on the fly
    var url = this.appendMenuActionUrl( "cmd=" + action + "&course_id=" + window.course_id + "&toc_id=" + toc_id + "&retUrl=" + escape( document.location.href ) );
    var form = new Element( 'form', { action: url, method: 'POST', style: 'display:none;' } );
    document.body.appendChild( form );
    var nonceInput = new Element( 'input', { type: 'hidden', name: courseMenu.nonceKey, value: courseMenu.nonceValue } );
    form.appendChild( nonceInput );
    form.submit();
  },

  toggleItemGuestAccess: function( toc_id )
  {
    this.submitRequestAsPost( 'modifyGuestAccessibility', toc_id );
  },

  toggleItemObserverAccess: function( toc_id )
  {
    this.submitRequestAsPost( 'modifyObserverAccessibility', toc_id );
  },

  renameItem: function( toc_id, targetType )
  {
   var subHeaderId = 'paletteItem:' + toc_id;
   var val;
   this.renameTocId = toc_id;
   if(targetType)
   {
     this.renameTargetType = targetType;
     val = $(subHeaderId).down('h3').down('span').innerHTML;
     $('renameSubHeaderInputBox').value = val;
     Position.clone($(subHeaderId).down('h3').down('span'),$("renameSubHeaderForm"),{ setLeft: true, setTop: true, setWidth: false, setHeight: false } );
   }
   else
   {
     this.renameTargetType = '';
     val = $(subHeaderId).down('a',0).down('span',0).innerHTML;
     $('renameSubHeaderInputBox').value = val;
     Position.clone($(subHeaderId).down('a',0).down('span',0),$("renameSubHeaderForm"),{ setLeft: true, setTop: true, setWidth: false, setHeight: false } );
   }
   $("renameSubHeaderForm").setStyle({display : 'block'});
   if (!this.modalOverlay)
   {
     this.modalOverlay = new ModalOverlay( $("renameSubHeaderForm") );
   }
   this.modalOverlay.setDisplay( true );
   $("renameSubHeaderInputBox").focus();
   $("renameSubHeaderInputBox").select();
  },

  onKeyDown: function( event )
  {
  if (event.keyCode == Event.KEY_ESC)
  {
      Event.stop( event );
      this.cancelRename();
  }

  else if ( $("renameSubHeaderInputBox").value != "" && event.keyCode == Event.KEY_RETURN)
  {
    Event.stop( event );
    this.saveRenamedSubHeaderItem();
  }
  },

  cancelRename: function()
  {
    this.modalOverlay.setDisplay( false );
    $("renameSubHeaderForm").setStyle({display : 'none'});
  },

  saveRenamedSubHeaderItem: function()
  {
    var toc_id = this.renameTocId;
    var new_name = $("renameSubHeaderInputBox").value;

    if(!new_name.blank())
    {
      var subHeaderId = 'paletteItem:' + toc_id;
      var url = this.appendMenuActionUrl( 'cmd=renameSubHeader&course_id='+window.course_id+'&toc_id='+toc_id+'&new_name='+encodeURIComponent(new_name) );
      new Ajax.Request( url, {
        onSuccess: function(transport, json) {
        var result = transport.responseText.evalJSON( true );
        if ( result.success == "true" )
        {
          var newValue = $('renameSubHeaderInputBox').value;
          $('renameSubHeaderInputBox').value = '';
          $("renameSubHeaderForm").setStyle({display : 'none'});
          var dispElem;
          if(this.renameTargetType == "subheader")
          {
            dispElem = $(subHeaderId).down('h3').down('span');
            dispElem.title = result.newName;
            dispElem.innerHTML = result.newName;
          }
          else
          {
            var link = $(subHeaderId).down('a',0);
            dispElem = link.down('span',0);
            dispElem.title = result.newName;
            dispElem.innerHTML = result.newName;
            if ( link.href.include('courseTocLabel=') )
            {
              // Also rewrite the url of the link to insert the new name in it
              link.href = link.href.sub( /courseTocLabel=([^&]+)/, 'courseTocLabel=' + encodeURIComponent( newValue ) );
            }
          }
        }
       else
       {
         $("renameSubHeaderForm").setStyle({display : 'none'});
         new page.InlineConfirmation("error", result.errorMessage, false );
       }
         this.modalOverlay.setDisplay( false );
      }.bind(this)
    });
    }
    else
    {
      this.cancelRename();
    }
  },

  _afterModifyItem: function ( result)
  {
    $('observerEnabledId').removeAttribute("checked");
  $('guestEnabledId').removeAttribute("checked");
  },

  _afterModifyExternalLinkItem: function ( result)
  {
    var tocId = 'paletteItem:' + result.tocId;
    var tocLink = $(tocId).down('a');
    tocLink.setAttribute( "href",result.linkUrl );
    if ( result.forceNewWindow == "true" )
    {
      tocLink.setAttribute( "target", "_blank" );
      new page.InlineConfirmation("warning", result.forceNewWindowWarning, false );
    }
  },

  _addNewMenuItem: function( result )
  {
    var newItem = result.returnData;

    var inWizard = page.util.hasClassName( document.body, 'wizardBody' );

    // If it's a CONTENT_ITEM type and it has a URL, and we're not in the course creation
    // wizard, redirect to that view URL.
    if( newItem.type == 'CONTENT_ITEM' && !inWizard && newItem.href && newItem.href != '#' )
    {
      document.location.href = newItem.href;
      return;
    }
    // If it's in the course creation wizard, disable the link.
    else if ( inWizard )
    {
      newItem.href = "#";
      newItem.target = "";
    }

    var template = courseMenu.Util.getTocItemTemplate( newItem.type, newItem.enabled == 'false', newItem.empty == 'true', this.menuGeneratorUrl );
    // create the appropriate html for the menu item using a template and the returned data,
    // then add it to the bottom of the coursemenu
    var syntax = /(^|.|\r|\n)(<\&=\s*(\w+)\s*\&>)/; //matches symbols like '<&= field &>'
    var t = new Template( template, syntax );
    var d = t.evaluate( newItem );
    $('courseMenuPalette_contents').insert({bottom: d});

    // add a select option for the item to the accessibleToolSelect
    dragdrop.ListReordering.addDivs();
    var sel = $('courseMenuPalette_pageListReorderControlSelect');
    var itemName = newItem.name;
    if ( newItem.type == 'SUBHEADER' )
    {
      itemName = page.bundle.getString("subheaderColonStr", itemName);
    }

    sel.options[sel.length] = new Option( itemName, newItem.id );
    dragdrop.ListReordering.removeDivs();

    // re-init DND by disabling and enabling it so new item is dragable
    var dnd = dragdrop.controllers.find( function( dndController )
    {
      return ( dndController.itemContainer && dndController.itemContainer.id == 'courseMenuPalette_contents');
    }.bind(this));
    dnd.disableDragAndDrop();
    dnd.enableDragAndDrop();
    dnd.calculateItemOrder();
    //show the course menu reorder button
    $( 'courseMenuPalette_reorderControlLink' ).up( 'li' ).show();
    // add behavior to context menu of new item
    var items = $('courseMenuPalette_contents').childNodes;
    var lastItem = items[items.length-1];
    var contextMenu = $(lastItem).down( ".contextMenuContainer" );
    if ( contextMenu )
    {
      new page.ContextMenu( contextMenu );
    }
    var id = lastItem.id;
    id = id.replace("paletteItem","label");

    // Focus on the new menu item after the DOM is ready
    (function()
    {
        if ( $(id) != null )
        {
            $(id).focus();
        }
    }.defer());
  },

  _showCourseMenuInWindow: function( event )
  {
    if ( event )
    {
      Event.stop( event );
    }
    var lpix = screen.width - 800;
    window.remote = window.open('/webapps/blackboard/content/courseMenu.jsp?course_id='+window.course_id+'&newWindow=true&openInParentWindow=true', 'newwin', 'width=220,height=440,resizable=yes,scrollbars=yes,status=no,top=20,left='+lpix);
    if ( window.remote )
    {
      window.remote.focus();
      if ( !window.remote.opener )
      {
        window.remote.opener = self;
      }
      window.top.name = 'bbWin';
    }
  },

  _showCourseLinkPicker: function( )
  {
    var lpix = screen.width - 800;
    window.remote = window.open('/webapps/blackboard/execute/course/courseMapPicker?displayMode=courseLinkPicker&course_id='+window.course_id, 'picker_browse', 'width=250,height=350,resizable=yes,scrollbars=yes,status=yes,top=20,left='+lpix);
    if ( window.remote )
    {
      window.remote.focus();
      if ( !window.remote.opener )
    {
        window.remote.opener = self;
      }
      window.remote.opener.inputItemPathToSet = $('linkLocation');
      window.remote.opener.inputItemPKToSet = $('linkId');
      window.remote.opener.inputItemTypeToSet = $('linkType');
      window.remote.opener.callBack = this._linkPickerCallback.bind( this );
      window.top.name = 'bbWin';
    }
  },

  _showModifyCourseLinkPicker: function( )
  {
    var lpix = screen.width - 800;
    window.remote = window.open('/webapps/blackboard/execute/course/courseMapPicker?displayMode=courseLinkPicker&course_id='+window.course_id, 'picker_browse', 'width=250,height=350,resizable=yes,scrollbars=yes,status=yes,top=20,left='+lpix);
    if ( window.remote )
    {
      window.remote.focus();
      if ( !window.remote.opener )
    {
        window.remote.opener = self;
      }
      window.remote.opener.inputItemPathToSet = $('modifiedLinkLocation');
      window.remote.opener.inputItemPKToSet = $('modifiedLinkId');
      window.remote.opener.inputItemTypeToSet = $('modifiedLinkType');
      window.remote.opener.callBack = this._ModifyLinkPickerCallback.bind( this );
      window.top.name = 'bbWin';
    }
  },

  _ModifyLinkPickerCallback: function( )
  {
    flyoutform.flyoutForms.modifyCourseLinkForm.updateSubmitButtonEnable();
  },

  _linkPickerCallback: function( )
  {
    var link_name = $("linkLocation").value.split('/').pop();
    var linkNameField = $("addCourseLinkName");
    var origName = linkNameField.value;
    if (origName.trim() == '')
    {
      linkNameField.value = link_name;
    }
    flyoutform.flyoutForms.addCourseLinkForm.updateSubmitButtonEnable();
  },

  _showDetailView: function( event )
  {
    if ( event )
    {
      Event.stop( event );
    }

    CourseMenuDWRFacade.setMenuDisplayMode( window.course_id, true);

    if ( this.quickViewLink )
    {
      this.quickViewLink.removeClassName('active');
    }

    // set the curently active palette contents container so expand/collapse on palette will work
    page.PaletteController.setActivePaletteContentsContainer( "courseMenuPalette", this.detailViewContainer );

    var keyboardDndLink = $('courseMenuPalette_reorderControlLink');
    if ( keyboardDndLink )
    {
      keyboardDndLink.up().hide();
    }
    var addItemLink = $('addCmItem');
    if ( addItemLink )
    {
      addItemLink.hide();
    }
    this.quickViewContainer.hide();
    this.detailViewContainer.show();

    if ( !this.tree || this.editMode )
    {
      var displayMode = "courseMenu";
      if ( this.inNewWindow )
      {
        displayMode = "courseMenu_newWindow";
      }
      this.tree = new dynamictree.Tree( this.detailViewContainer, null, '/webapps/blackboard/execute/course/menuFolderViewGenerator', 'course_id='+window.course_id+'&displayMode='+displayMode+'&editMode='+this.editMode+'&openInParentWindow=true', true );
    }

  },

  _detailViewExpandAll: function( event )
  {
    Event.stop( event );
    if ( this.tree )
    {
      this.tree.expandAll();
    }
  },

  _detailViewCollapseAll: function( event )
  {
    Event.stop( event );
    if ( this.tree )
    {
      this.tree.collapseAll();
    }
  },

  _showQuickView: function( event )
  {
    if ( event )
    {
      Event.stop( event );
    }

    this.quickViewLink.addClassName('active');

    // set the curently active palette contents container so expand/collapse on palette will work
    page.PaletteController.setActivePaletteContentsContainer( "courseMenuPalette", this.quickViewContainer );

    var keyboardDndLink = $('courseMenuPalette_reorderControlLink');
    if ( keyboardDndLink )
    {
      keyboardDndLink.up().show();
    }
    var addItemLink = $('addCmItem');
    if ( addItemLink )
    {
      addItemLink.show();
    }
    this.quickViewContainer.show();
    this.detailViewContainer.hide();

    CourseMenuDWRFacade.setMenuDisplayMode( window.course_id, false);
  },

  _refreshMenu: function( event )
  {
    Event.stop( event );
    var loc = window.location + '';
    var hashLoc = loc.indexOf("#");
    if ( hashLoc >= 0 )
    {
      loc = loc.substring(0, hashLoc);
    }
    if ( loc.indexOf('refreshCourseMenu') < 0 )
    {
      loc = this.appendQueryString( loc, 'refreshCourseMenu=true' );
    }
    window.location = loc;
  },

  _guestEnrollToggle: function( event )
  {
    Event.stop( event );
    window.location = '/webapps/blackboard/execute/enrollCourse?context=INMENU&course_id='+window.course_id;
  },

  _quickEnrollToggle: function( event )
  {
    Event.stop( event );
    var nonceIdValue = nonceUtil.getNonceIdValue(/* no formId since there is not form for the quick enroll drop down*/);

    if ( this.quickEnrollLink.hasClassName("enrolled") )
    {
      if ( confirm( window.confirmQuickUnenrollMsg ) )
      {
       // using a get request to modify the role is not the best practice, if we refactor make this a new Ajax.request post, since this modifying the data
        var returnUrl = document.location.href;

        // When a instructor is not in edit mode and click Quick Unenroll, the page should be redirected to edit mode page url, the url has been set as a parameter in editModeToggleLink element, fetch it from there.
        var editModeToggleLink = $('editModeToggleLink');
        var editModeParam = "";
        if( editModeToggleLink && editModeToggleLink.hasClassName("read-off") )
        {
          // The common cases of editModeToggleLink href are
          // javascript:designer_participant.toggleEditMode('editUrl', ,) or javascript:designer_participant.toggleEditMode(null, ,)
          // we use the regex to get the content of first argument.
          var editModeUrlMatch = editModeToggleLink.href.match( /\(\'*(.*?)\'*\,/ );
          if( editModeUrlMatch )
          {
            var editModeurl = editModeUrlMatch[1];
            if( editModeurl != 'null' )
            {
              editModeParam = '&editUrl=' + escape( window.location.protocol + "//" + window.location.host + editModeurl );
            }
          }
        }
        window.location = this.appendMenuActionUrl( 'cmd=quickEnrollToggle&course_id=' + window.course_id + '&retUrl=' + escape(returnUrl) + '&blackboard.platform.security.NonceUtil.nonce=' + nonceIdValue + editModeParam );
      }
    }
    else
    {
      var roleId = event.target.parentNode.id;
      if ( roleId.indexOf("paletteItem") > -1 )
      {
        roleId = roleId.substring(12);
        var name = ( typeof event.target.parentNode.childNodes[0].value == "undefined" )? event.target.parentNode.childNodes[1].value : event.target.parentNode.childNodes[0].value;
        if ( confirm( page.bundle.getString( "confirmQuickEnrollStr", name ) ) )
        {
         // using a get request to modify the role is not the best practice, if we refactor make this a new Ajax.request post, since this modifying the data
          window.location = this.appendMenuActionUrl( 'cmd=quickEnrollToggle&course_id='+window.course_id+'&targetRole='+roleId+'&retUrl='+escape(document.location.href) + '&blackboard.platform.security.NonceUtil.nonce=' + nonceIdValue );
        }
      }
      else
      {
        if ( confirm( window.confirmQuickEnrollMsg ) )
        {
          // using a get request to modify the role is not the best practice, if we refactor make this a new Ajax.request post, since this modifying the data

          window.location = this.appendMenuActionUrl( 'cmd=quickEnrollToggle&course_id='+window.course_id+'&targetRole=P'+'&retUrl='+escape(document.location.href) + '&blackboard.platform.security.NonceUtil.nonce=' + nonceIdValue );
        }
      }
    }
  },

  appendMenuActionUrl : function( paramsToAppend )
  {
    return this.appendQueryString( this.menuActionUrl, paramsToAppend + '&' + courseMenu.nonceKey + '=' + courseMenu.nonceValue );
  },

  appendQueryString : function( baseUrl, paramsToAppend )
  {
    var paramSeparator = baseUrl.indexOf( '?' ) != -1 ? '&' : '?';
    return baseUrl + paramSeparator + paramsToAppend;
  },

  initPaletteState: function()
  {
    var activeCourseMenuContentsContainer = page.PaletteController.getPaletteControllerObjById( "courseMenuPalette" ).getActiveContentsContainer();
    this.getCourseMenuPaletteStateResponse(ClientCache.getItem( activeCourseMenuContentsContainer.id + window.course_id));
    this.getMyGroupsPaletteStateResponse(ClientCache.getItem( 'myGroups_contents' + window.course_id, ) );
    this.getControlPanelPaletteStateResponse(ClientCache.getItem( 'controlPanelPalette_contents' + window.course_id ) );
    this.getPickerPaletteStateResponse(ClientCache.getItem( 'pickerPalette_contents' + window.course_id ) );
  },

  /**
   * By default, palettes are expanded.  However, the "Files" palette's default
   * behavior is to be collapsed.
   *
   * This function ensures when the course menu loads, the "Files" palette default collapsed behavior
   * is enforced.
   */
  getPickerPaletteStateResponse : function ( paletteState  )
  {
    if ($('pickerPalette') === null)
    {
      // No File Manager palette found.
      return;
    }

    if (paletteState !== 'block')
    {
      // File palette was closed on the prior page, ensure Files palette is closed when this page is loaded.
      page.PaletteController.collapsePalette('pickerPalette', true);
    }
  },

  getCourseMenuPaletteStateResponse : function ( paletteState  )
  {
    this.getPaletteStateResponse( paletteState, 'courseMenuPalette' );
  },

  getMyGroupsPaletteStateResponse : function ( paletteState  )
  {
    this.getPaletteStateResponse( paletteState, 'myGroups' );
  },

  getControlPanelPaletteStateResponse : function ( paletteState  )
  {
    this.getPaletteStateResponse( paletteState, 'controlPanelPalette' );
  },

  getPaletteStateResponse : function ( paletteState, id )
  {
    if ( !$(id) ) //If the palette doesn't exist on the page, don't do anything
    {
      return;
    }

    var paletteItem = $(page.PaletteController.getDefaultContentsContainerId(id));

    // if the course menu palette, get the currently active contents container
    if( id == 'courseMenuPalette' )
    {
      // get the active palette content container element (List VS Folder view)
      paletteItem = this.quickViewContainer;
      if( this.expandAllLink && this.collapseAllLink )
      {
        paletteItem = this.detailViewContainer;
    }
    }

    var originalPaletteState = paletteItem.style.display;
    if( originalPaletteState != 'none' && originalPaletteState != 'block' )
    {
      originalPaletteState = 'block';
    }
    var cachedPaletteState = 'block';
    if ( paletteState && paletteState.length > 0 )
    {
      if ( paletteState == 'none' || paletteState == 'block' )
      {
        cachedPaletteState = paletteState;
      }
       else
      {
         cachedPaletteState = 'block';
      }
    }

    if ( originalPaletteState != cachedPaletteState )
    {
      //because we want the menu to be in the cached state,
      //we pass in the opposite so that expandCollapse changes the menu state.
      // pass true for 2nd param to supress persisting state on init
      page.PaletteController.toggleExpandCollapsePalette(id, true);
    }
  }

};

courseMenu.searchWidget = {
  goOnClick : function()
  {
    if ( $('toolsSearchBox').value.trim() )
    {
      window.location = $('searchGo').href + "&" + $('toolsSearchBox').name + "=" + $('toolsSearchBox').value;
    }
    else
    {
      alert( page.bundle.getString("enterSearchKeyStr") );
    }
    return false;
  },

  onKeydown : function( event )
  {
    var e = event || window.event;
    var key = e.keyCode || e.which;
    if ( key == Event.KEY_RETURN )
    {
      this.goOnClick();
    }
  }
};

function collapsePalettesForGroupSpace(groupId)
{
  // Expand the group in the my groups palette that was clicked
  // the my groups palette may not exist on the doc yet if current user isn't part of a group
  var myGroupsPalette = $('myGroups_contents');
  if( myGroupsPalette )
  {
    // NOTE - do NOT explicitly close all other palettes - while it may have been a requirement
    // at one point in time it appears as though it has come back several times as a bug.
    page.PaletteController.expandPalette('myGroups');

    var groupmenulink = ('mygroups.' + groupId + '_groupExpanderLink');
    var itemExpanderObj = page.ItemExpander.itemExpanderMap[groupmenulink];
    if( itemExpanderObj )
    {
      itemExpanderObj.expandCollapse(false);
    }
  }
}

function instructorSettingsMobileMenu()
{
  $j(".mobile-course-instructor-settings-button").on('click', function(e){
    $j(".breadcrumb-controls").toggleClass("instructor-controls-open");
    e.stopPropagation();
  });
}

function mobileCourseMenuMods()
{
  $j(".breadcrumbs").addClass('breadcrumb-mobile-mods-initialized');

  var breadcrumbMobileButton = $j(".breadcrumb-mobile-mods-initialized").find("ol").find(".placeholder:last-of-type");

  $j(breadcrumbMobileButton).on("click", function(e) {
      $j(".breadcrumb-mobile-mods-initialized").find("ol").toggleClass("breadcrumb-mobile-menu-open");
      e.stopPropagation();
  });

  $j(document.body).on("click", function(e) {
    $j(".breadcrumb-mobile-mods-initialized").find("ol").removeClass("breadcrumb-mobile-menu-open");
  });
}

function reverseMobileCourseMenuMods()
{
  $j(".breadcrumbs").removeClass('breadcrumb-mobile-mods-initialized');

  $j(".mobile-course-instructor-settings-button").off("click");

  var breadcrumbMobileButton = $j(".breadcrumb-mobile-mods-initialized").find("ol").find(".placeholder:last-of-type");
  $j(breadcrumbMobileButton).off("click");

  $j(document.body).off("click");
}

if (window.matchMedia("(max-width: 1037px)").matches) {
  instructorSettingsMobileMenu();
  mobileCourseMenuMods();
}

$j(window).on("resize", function() {
  if($j(window).width() < 1038) {
    reverseMobileCourseMenuMods();
    instructorSettingsMobileMenu();
    mobileCourseMenuMods();
  } else {
    reverseMobileCourseMenuMods();
  }
});

function changeAriaExpandedValue(elementId){
	let domElement = document.getElementById(elementId);
	var ariaExpandedCurrentStatus = domElement.getAttribute('aria-expanded');
	if(ariaExpandedCurrentStatus === 'true'){
		domElement.setAttribute('aria-expanded', 'false');
	} else {
		domElement.setAttribute('aria-expanded', 'true');
	}
}
