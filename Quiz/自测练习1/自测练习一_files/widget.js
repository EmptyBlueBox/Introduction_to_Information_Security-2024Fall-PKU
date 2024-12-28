var widget =
{};

widget.colorPickers =
{};

widget.ColorPicker = Class.create();

widget.ColorPicker.prototype =
{
    /**
     * Constructor
     *
     * @param name - id of the color picker
     * @param initialColor - initial color hex string ("#000000")
     * @param alertMsg - localized error msg string ("Error: A valid color value must be specified")
     * @param previewIdStr - optional id string of the color preview DIV container user can specify
     * @param allowTransparent - optional boolean whether to render an option to select transparent. Default is false.
     */
    initialize : function( name, initialColor, alertMsg, previewIdStr, previewBackgroundIdStr, allowTransparent )
    {
      this.theColorPickerName = name;
      this.allowTransparent = ( !allowTransparent ) ? false : true;
      this.theMenu = $( name );
      this.alertMsg = alertMsg;
      this.userPreviewContainer = $( previewIdStr ); // may be undefined
      this.userPreviewBackgroundContainer = $( previewBackgroundIdStr ); // may be undefined
      if ( typeof this.userPreviewContainer == "undefined" )
      {
        this.userPreviewContainer = null;
      }
      if ( typeof this.userPreviewBackgroundContainer == "undefined" )
      {
        this.userPreviewBackgroundContainer = null;
      }
      this.colorListParent = $( name + '_colorlist_parent' );

      widget.ColorPicker.registerColorPicker( this );

      this.ie = document.all && navigator.userAgent.indexOf( "Opera" ) == -1;
      this.color_hidden_input = $( name + "_title_color_input" );
      this.color_hidden_input.value = initialColor;
      this.color_hidden_input._defaultValue = initialColor;
      this.anch_link = $( name + "_link" );
      this.color_link = $( name + "_img" );
      this.color_name_label = $( name + "_color_name_label" );
      this.title_color_input = $( name + "_title_color" );
      this.setDisplay( initialColor, this.getDisplayColorInfo( initialColor, false ) );
      this.color_name_label.innerHTML = this.getDisplayColorInfo( initialColor, true );
      var backgroundStyle = initialColor;
      if( initialColor === "transparent" )
      {
        backgroundStyle = 'url(' + getCdnURL( "/images/swatches/transparent.gif" ) + ')';
      }
      this.color_link.setStyle(
      {
        background : backgroundStyle
      } );
      this.updateUserPreviewContainerColor( initialColor );
      if ( this.anch_link )
      {
        Event.observe( this.anch_link, "click", this.onOpen.bindAsEventListener( this ) );
      }
      Event.observe( document.body, "click", this.closeColorPickers.bindAsEventListener( this ) );
      Event.observe( this.theMenu, 'keydown', this.onKeyPress.bindAsEventListener( this ) );
      Event.observe( this.theColorPickerName + '_previewColorLink', 'click', this.previewListener
          .bindAsEventListener( this ) );
      Event.observe( this.theColorPickerName + '_cancelButton', 'click', this.onClose.bindAsEventListener( this ) );
      Event.observe( this.theColorPickerName + '_submitButton', 'click', this.onApply.bindAsEventListener( this ) );

      this.skip_link = $( name + "_skip_link" );
      if ( this.skip_link )
      {
        Event.observe( this.skip_link, "click", this.onSkipLinkClick.bindAsEventListener( this ) );
      }

      // relocate color picker popup div to the bottom of the doc b/c of css display issues
      Element.remove( this.theMenu );
      document.body.appendChild( this.theMenu );

      widget.colorPickers[ this.theColorPickerName ] = this;
    },

    onSkipLinkClick : function( event )
    {
      $( this.theColorPickerName + '_submitButton' ).focus()
    },

    onKeyPress : function( event )
    {
      var key = event.keyCode || event.which;
      if ( key == Event.KEY_ESC )
      {
        this.onClose( event );
      }
    },

    closeColorPickers : function( event )
    {
      var element = Event.element( event );
      widget.ColorPicker.colorPickers.each( function( cp )
      {
        if ( cp != this && !element.descendantOf( cp.theMenu ) )
        {
          cp.close();
        }
      }.bind( this ) );

    },
    setOnChangeHandler : function( handler )
    {
      this.onChangeHandler = handler;
    },
    setDefaultColor : function( colorValue )
    {
      this.color_hidden_input.value = colorValue;
      this.color_hidden_input._defaultValue = colorValue;
      if ( colorValue === "transparent" )
      {
        this.color_link.setStyle(
        {
          background : 'url(' + getCdnURL( "/images/swatches/transparent.gif" ) + ')'
        } );
      }
      else
      {
        this.color_link.setStyle(
        {
          background : colorValue
        } );
      }
      this.setDisplay( colorValue, this.getDisplayColorInfo( colorValue, false ) );
      this.color_name_label.innerHTML = this.getDisplayColorInfo( colorValue, true );
    },
    setColor : function( colorValue )
    {
      widget.ShowUnsavedChanges.changeHiddenValue( this.color_hidden_input, colorValue );
      if ( colorValue === "transparent" )
      {
        this.color_link.setStyle(
        {
          background : 'url(' + getCdnURL( "/images/swatches/transparent.gif" ) + ')'
        } );
      }
      else
      {
        this.color_link.setStyle(
        {
          background : colorValue
        } );
      }

      this.setDisplay( colorValue, this.getDisplayColorInfo( colorValue, false ) );
      this.color_name_label.innerHTML = this.getDisplayColorInfo( colorValue, true );
      this.updateUserPreviewContainerColor( colorValue );
      if ( this.onChangeHandler )
      {
        this.onChangeHandler();
      }
    },

    getPaletteInstance : function()
    {
      if ( !this.paletteInstance )
      {
        this.paletteInstance = Element.clone( widget.ColorPicker.colorPalette, true );
      }
      return this.paletteInstance;
    },

    deletePaletteInstance : function()
    {
      if ( this.paletteInstance )
      {
        Event.stopObserving( this.paletteInstance, 'click' );
        this.paletteInstance.remove();
        delete this.paletteInstance;
      }
    },

    onOpen : function( event )
    {
      this.closeColorPickers( event );
      this.colorListParent.appendChild( this.getPaletteInstance() );
      this.initializeTransparent();
      Event.observe( this.getPaletteInstance(), 'click', this.setColorFromSwatch.bindAsEventListener( this ) );
      var offset = Position.cumulativeOffset( this.anch_link );
      this.theMenu.setStyle(
      {
          display : "block",
          position : "absolute"
      } );
      var width = this.theMenu.getWidth();
      var bodyWidth = $( document.body ).getWidth();

      var menuDims = this.theMenu.getDimensionsEx();
      var anchorDims = this.anch_link.getDimensionsEx();
      var menuHeight = menuDims.height;
      var viewportDimensions = document.viewport.getDimensions();
      var scrollOffsets = document.viewport.getScrollOffsets();
      // Use viewport relative offsets to figure out placement within the view
      var offsetTop = offset[ 1 ] - scrollOffsets.top - this.anch_link.cumulativeScrollOffset()[1];
      var offsetLeft = offset[ 0 ] - scrollOffsets.left;

      var xpos = offsetLeft;
      if ( page.util.isRTL() )
      {
        xpos = xpos + this.anch_link.getWidth() - width;
      }
      if ( xpos + width > viewportDimensions.width )
      {
        // First try to position it on the left of the link instead of the right
        xpos = offsetLeft - width + anchorDims.width;
        if ( xpos < 0 )
        {
          // If we go off the page though, just try our best
          xpos = viewportDimensions.width - width;
        }
      }
      if ( xpos < 0 )
      {
        xpos = 0;
      }
      var ypos = offsetTop + anchorDims.height;
      if ( ( ypos + menuHeight ) > viewportDimensions.height )
      {
        // Try to position above the color picker first
        ypos = offsetTop - menuHeight;
        if ( ypos < 0 )
        {
          // but if it goes off the top of the page just do a best-effort.
          ypos = ypos - ( ypos + menuHeight - viewportDimensions.height );
          if ( ypos < 0 )
          {
            ypos = 0;
          }
        }
      }
      // The color swatch is positioned absolutely, so adjust offsets to include the scrollofset
      ypos = ypos + (scrollOffsets.top*2);
      xpos = xpos + scrollOffsets.left;
      this.theMenu.setStyle(
      {
          left : xpos + "px",
          top : ypos + "px"
      } );
      this.title_color_input.focus();
      ( function()
      {
        if ( !this.shim )
        {
          this.shim = new page.popupShim( this.theMenu );
        }
        this.shim.open();
      }.bind( this ).defer() );
      Event.stop( event );
    },

    /**
     * Removes the transparent choice from the palette if the picker is not supposed to support transparency.
     */
    initializeTransparent : function()
    {
      if ( !this.allowTransparent )
      {
        var transparentLi = this.colorListParent.down( 'li#colorlist_transparent' );
        if ( transparentLi )
        {
          Element.remove( transparentLi );
        }
      }
    },

    /**
     * Hides the color picker.
     */
    onClose : function()
    {
      this.close();
      this.anch_link.focus();
    },

    close : function()
    {
      this.deletePaletteInstance();

      this.theMenu.setStyle(
      {
        display : "none"
      } );
      if ( this.shim )
      {
        this.shim.close();
      }
    },

    /**
     * Sets the preview color and text to the color selected by the user in the palette
     */
    setColorFromSwatch : function( event )
    {
      var element = Event.element( event );
      if ( element.hasClassName( 'transparent' ) )
      {
        this.setDisplay( "transparent", page.bundle.getString( "colorpicker.color.transparent" ) );
      }
      else
      {
        var text = element.childNodes[ 0 ].nodeValue;
        if ( text )
        {
          this.setDisplay( text.substring( 0, 7 ), this.getDisplayColorInfo( text.substring( 0, 7 ), false ) );
        }
      }
      Event.stop( event );
    },

    getDisplayColorInfo : function( hexValue, onlyColorName )
    {
      var transparent = false;
      var localizedName;
      var safeColorCode;
      if ( hexValue === "transparent" )
      {
        transparent = true;
        localizedName = widget.ColorPicker.colorPickerPaletteMap[ "default" ][ hexValue ];
      }
      else
      {
        safeColorCode = this.getSafeColorCode( hexValue ).toUpperCase();
        //The keys in ColorPickerMap are all 6 digit safe color codes, that's we need to make sure that we're using the correct key to lookup the color.
        localizedName = widget.ColorPicker.colorPickerPaletteMap[ "default" ][ safeColorCode ];
      }

      if ( !localizedName )
      {
        localizedName = '';
      }
      var colorName;
      colorName = localizedName + ' (' + hexValue + ')';

      if ( onlyColorName || transparent )
      {
        colorName = localizedName;
      }
      return colorName;
    },


    /**
     * Returns a Six digit Hexadecimal Color Code.
     */
    getSafeColorCode : function( hexValue )
    {
      return hexValue.replace( /#([\d0-9A-Fa-f])([\d0-9A-Fa-f])([\d0-9A-Fa-f])$/,'#$1$1$2$2$3$3');
    },


    /**
     * Handles the Preview functionality on the swatch. If an inappropriate color is choosen, a msg is displayed to the
     * user. Else updates the color preview with the manually entered color.
     */
    previewListener : function( event )
    {
      if ( !this.isValidColor( this.title_color_input.value ) )
      {
        alert( this.alertMsg );
        return;
      }
      if ( this.title_color_input.value.length != 6 )
      {
        return;
      }
      var prevCol;

      if ( this.title_color_input.value.toLowerCase() === "xxxxxx" )
      {
        prevCol = "transparent";
        this.setDisplay( prevCol, page.bundle.getString( 'colorpicker.color.transparent' ) );
      }
      else
      {
        prevCol = '#' + this.title_color_input.value;
        this.setDisplay( prevCol, this.getDisplayColorInfo( prevCol, false ) );
      }

      Event.stop( event );
    },

    /**
     * Updates the color preview panel in the picker pop up
     */
    setDisplay : function( col, text )
    {
      if ( col === "transparent" )
      {
        $( this.theColorPickerName + '_swatchpreview' ).setStyle(
        {
          background : 'url(' + getCdnURL( "/images/swatches/transparent_lrg.gif" ) + ')'
        } );
        $( this.theColorPickerName + '_color_text' ).setStyle(
        {
          color : '#ffffff'
        } );
        this.title_color_input.value = 'XXXXXX';
      }
      else
      {
        $( this.theColorPickerName + '_swatchpreview' ).setStyle(
        {
          background : col
        } );
        $( this.theColorPickerName + '_color_text' ).setStyle(
        {
          color : col
        } );
        this.title_color_input.value = ( col.startsWith( '#' ) ) ? col.substr( 1 ) : col;
      }

      $( this.theColorPickerName + '_title_color_name' ).innerHTML = text;
    },

    /**
     * Checks for a valid color value.
     */
    isValidColor : function( color_value )
    {
      var isValid = false;

      isValid = ( /^[0-9A-Fa-f]{6}/ ).test( color_value );
      if ( !isValid && this.allowTransparent )
      {
        isValid = color_value.toLowerCase() === "xxxxxx";
      }
      return isValid;
    },

    /**
     * Manages the functionality for the Apply button the swatch.
     */
    onApply : function( event )
    {
      var color = this.title_color_input.value;
      if ( !this.isValidColor( color ) )
      {
        return;
      }

      if ( this.title_color_input.value.toLowerCase() === "xxxxxx" )
      {
        this.color_link.setStyle(
        {
          background : 'url(' + getCdnURL( "/images/swatches/transparent.gif" ) + ')'
        } );
        color = "transparent";
        this.color_name_label.innerHTML = page.bundle.getString( "colorpicker.color.transparent" );
      }
      else
      {
        color = '#' + color;
        this.color_link.setStyle(
        {
          background : color
        } );
        this.color_name_label.innerHTML = this.getDisplayColorInfo( color, true );
      }

      widget.ShowUnsavedChanges.changeHiddenValue( this.color_hidden_input, color );

      this.updateUserPreviewContainerColor( color );
      this.onClose();
      if ( this.onChangeHandler )
      {
        this.onChangeHandler();
      }
      Event.stop( event );
    },

    /**
     * If the user specified preview container element exists, update its color style to the color given.
     *
     * @param color - color hex string
     */
    updateUserPreviewContainerColor : function( color )
    {
      if ( this.userPreviewContainer )
      {
        this.userPreviewContainer.style.color = color;
      }
      else if ( this.userPreviewBackgroundContainer )
      {
        this.userPreviewBackgroundContainer.style.background = color;
      }
    }

}; // end widget.ColorPicker.prototype

widget.ColorPicker.colorPickers = [];
widget.ColorPicker.colorPickerMap =
{};
widget.ColorPicker.colorPickerPaletteMap =
{};

widget.ColorPicker.registerColorPicker = function( cp )
{
  widget.ColorPicker.colorPickers.push( cp );
  widget.ColorPicker.colorPickerMap[ cp.theColorPickerName ] = cp;
  // grab the color definition and remove it from the DOM for the time being
  if ( !widget.ColorPicker.colorPalette )
  {
    var colorPalette = $( 'picker_colorlist' );

    // Store the colors and their localized names so we can look them up later.
    widget.ColorPicker.colorPickerPaletteMap[ "default" ] =
    {};
    var arrColors = Element.getElementsBySelector( colorPalette, "a" );
    for ( var i = 0; i < arrColors.length; i++ )
    {
      if ( !arrColors[ i ].hasClassName( "transparent" ) )
      {
        widget.ColorPicker.colorPickerPaletteMap[ "default" ][ arrColors[ i ].innerHTML.substring( 0, 7 ).toUpperCase() ] = arrColors[ i ].innerHTML
            .substring( 8 );
      }
    }
    widget.ColorPicker.colorPickerPaletteMap[ "default" ].transparent = page.bundle
        .getString( "colorpicker.color.transparent" );

    widget.ColorPicker.colorPalette = colorPalette;
    // deferring so that the name lookup for colors can succeed during init
    ( function()
    {
      Element.remove( colorPalette );
    }.defer() );
  }
};

widget.ColorPicker.closeAllColorPickers = function()
{
  widget.ColorPicker.colorPickers.each( function( cp )
  {
    cp.close();
  } );
};

widget.MultiSelect = Class.create();

widget.MultiSelect.multiselectBoxes = [];

// ---------------- "static" methods

widget.MultiSelect.registerMultiSelect = function( ms )
{
  widget.MultiSelect.multiselectBoxes.push( ms );
};

widget.MultiSelect.unRegisterMultiSelect = function( ms )
{
  widget.MultiSelect.multiselectBoxes.remove( ms );
};

widget.MultiSelect.prototype =
{
    initialize : function( multiSelectDiv, formName )
    {
      this.multiSelectDiv = $( multiSelectDiv );
      this.formName = formName;

      if ( this.multiSelectDiv )
      {
        this.leftClickListeners = [];
        this.rightClickListeners = [];
        var divs = this.multiSelectDiv.getElementsByTagName( 'div' );
        var leftDiv = $( divs[ 0 ] );
        var buttonDiv = $( divs[ 1 ] );
        var rightDiv = $( divs[ 2 ] );

        var inputs = this.multiSelectDiv.getElementsByTagName( 'input' );
        this.leftValues = $( inputs[ 0 ] );
        this.rightValues = $( inputs[ 1 ] );
        var leftSelects = leftDiv.getElementsByTagName( 'select' );
        var rightSelects = rightDiv.getElementsByTagName( 'select' );
        this.leftSelectBox = $( leftSelects[ 0 ] );
        this.rightSelectBox = $( rightSelects[ 0 ] );

        var buttons = buttonDiv.getElementsByTagName( 'button' );
        var moveRightButton = $( buttons[ 0 ] );
        var moveLeftButton = $( buttons[ 1 ] );
        var leftInputs = leftDiv.getElementsByTagName( 'input' );
        var leftInvertSelectionButton = $( leftInputs[ 0 ] );
        var leftSelectAllButton = $( leftInputs[ 1 ] );
        var rightInputs = rightDiv.getElementsByTagName( 'input' );
        var rightInvertSelectionButton = $( rightInputs[ 0 ] );
        var rightSelectAllButton = $( rightInputs[ 1 ] );
        widget.MultiSelect.registerMultiSelect( this );
        Event.observe( moveLeftButton, "click", this.onMoveLeftClick.bindAsEventListener( this ) );
        Event.observe( moveRightButton, "click", this.onMoveRightClick.bindAsEventListener( this ) );
        Event.observe( leftInvertSelectionButton, "click", this.onInvertSelection.bindAsEventListener( this, true ) );
        Event.observe( rightInvertSelectionButton, "click", this.onInvertSelection.bindAsEventListener( this, false ) );
        Event.observe( leftSelectAllButton, "click", this.onSelectAllClick.bindAsEventListener( this, true ) );
        Event.observe( rightSelectAllButton, "click", this.onSelectAllClick.bindAsEventListener( this, false ) );

        // This for the MultiSelectAction Bean.
        // If actionBean list is less than 1, button is displayed and not the dropdown
        if ( leftSelects.length > 1 )
        {
          this.actionBeanLeftSelect = $( leftSelects[ 1 ] );
          this.actionBeanRightSelect = $( rightSelects[ 1 ] );
          var actionBeanLeftGoBox = $( leftInputs[ 2 ] );
          var actionBeanRightGoBox = $( leftInputs[ 2 ] );
          Event.observe( actionBeanLeftGoBox, "click", this.actionBeanFunc.bindAsEventListener( this, true ) );
          Event.observe( actionBeanRightGoBox, "click", this.actionBeanFunc.bindAsEventListener( this, false ) );
        }
      }
    },
    actionBeanFunc : function( event, leftSelect )
    {
      var destination = this.actionBeanLeftSelect;
      var selectedBox = this.leftSelectBox;
      if ( !leftSelect )
      {
        destination = this.actionBeanRightSelect;
        selectedBox = this.rightSelectBox;
      }
      var myindex = destination.selectedIndex;
      if ( myindex == -1 || myindex > destination.length - 1 )
      {
        alert( page.bundle.getString( "admin.manageuserlists.selectionwarning" ) );
        return false;
      }
      var sFunctionName = destination.options[ myindex ].value;
      var oFunc = window[ sFunctionName ];
      oFunc( selectedBox.name, this.formName );
      this.setHiddenValues();
    },
    /*
     * listener registration for leftmove and rightmove clicks
     */
    addToLeftClickListener : function( listenerFunc )
    {
      if ( this.leftClickListeners )
      {
        this.leftClickListeners.push( listenerFunc );
      }
    },

    addToRightClickListener : function( listenerFunc )
    {
      if ( this.rightClickListeners )
      {
        this.rightClickListeners.push( listenerFunc );
      }
    },

    removeFromLeftClickListener : function( listenerFunc )
    {
      if ( this.leftClickListeners )
      {
        this.leftClickListeners.remove( listenerFunc );
      }
    },

    removeFromRightClickListener : function( listenerFunc )
    {
      if ( this.rightClickListeners )
      {
        this.rightClickListeners.remove( listenerFunc );
      }
    },

    removeAllLeftClickListeners : function()
    {
      this.leftClickListeners = [];
    },

    removeAllRightClickListeners : function()
    {
      this.rightClickListeners = [];
    },

    removeFromLeft : function( id )
    {
      if ( this.leftSelectBox )
      {
        var leftItems = this.leftSelectBox.immediateDescendants();
        var toRemoveElement = leftItems.find( function( item )
        {
          return !item.selected && item.value == id;
        } );
        if ( toRemoveElement )
        {
          Element.remove( toRemoveElement );
          this.setHiddenValues();
        }
      }
    },

    addToLeft : function( id, value, sortString )
    {
      if ( this.leftSelectBox )
      {
        var leftItems = this.leftSelectBox.immediateDescendants();
        var returnItem = leftItems.find( function( item )
        {
          return item.value == id;
        } );
        var exists = returnItem ? true : false;
        if ( !exists )
        {
          this.rawAddToLeft( id, value, sortString );
          this.setHiddenValues();
        }
      }
    },

    rawAddToLeft : function( id, value, sortString )
    {
      var item = document.createElement( "option" );
      item.value = id;
      item.innerHTML = value;
      item.setAttribute( 'sortString', sortString );
      this.leftSelectBox.appendChild( item );
    },

    removeFromRight : function( id )
    {
      if ( this.rightSelectBox )
      {
        var rightItems = this.rightSelectBox.immediateDescendants();
        var toRemoveElement = rightItems.find( function( item )
        {
          return !item.selected && item.value == id;
        } );
        if ( toRemoveElement )
        {
          Element.remove( toRemoveElement );
          this.setHiddenValues();
        }
      }
    },

    addToRight : function( id, value, sortString )
    {
      if ( this.rightSelectBox )
      {
        var rightItems = this.rightSelectBox.immediateDescendants();
        var returnItem = rightItems.find( function( item )
        {
          return item.value == id;
        } );
        var exists = returnItem ? true : false;
        if ( !exists )
        {
          var item = document.createElement( "option" );
          item.value = id;
          item.innerHTML = value;
          item.setAttribute( 'sortString', sortString );
          this.rightSelectBox.appendChild( item );
          this.setHiddenValues();
        }
      }
    },

    resetRightBox : function()
    {
      if ( this.rightSelectBox )
      {
        var rightItems = this.rightSelectBox.immediateDescendants();
        rightItems.invoke( "remove" );
        this.setHiddenValues();
      }
    },

    resetLeftBox : function()
    {
      if ( this.leftSelectBox )
      {
        var leftItems = this.leftSelectBox.immediateDescendants();
        leftItems.invoke( "remove" );
        this.setHiddenValues();
      }
    },

    getAllLeftAvailableElements : function()
    {
      if ( this.leftSelectBox )
      {
        return this.leftSelectBox.immediateDescendants();
      }
      else
      {
        return [];
      }
    },

    getAllRightElements : function()
    {
      if ( this.rightSelectBox )
      {
        var rightItems = this.rightSelectBox.immediateDescendants();
        return rightItems;
      }
      else
      {
        return [];
      }
    },

    onMoveLeftClick : function( event )
    {

      var rightItems = this.rightSelectBox.immediateDescendants();
      var selectedItems = rightItems.findAll( function( item )
      {
        return item.selected;
      } );
      var leftItems = this.leftSelectBox.immediateDescendants();
      if ( !selectedItems || selectedItems.length === 0 )
      {
        alert( page.bundle.getString( "admin.manageuserlists.selectionwarning" ) );
        return;
      }
      selectedItems.invoke( "remove" );
      selectedItems.each( function( item )
      {
        leftItems.push( item );
      } );
      leftItems = leftItems.sortBy( function( option )
      {
        return option.getAttribute( "sortString" );
      } );
      leftItems.each( function( item )
      {
        this.leftSelectBox.appendChild( item );
      }.bind( this ) );
      this.setHiddenValues();
      if ( this.leftClickListeners )
      {
        this.leftClickListeners.each( function( listenerFunc )
        {
          listenerFunc.apply( this, selectedItems );
        }.bind( this ) );

      }

    },

    onMoveRightClick : function( event )
    {

      var leftItems = this.leftSelectBox.immediateDescendants();
      var selectedItems = leftItems.findAll( function( item )
      {
        return item.selected;
      } );
      var rightItems = this.rightSelectBox.immediateDescendants();
      if ( !selectedItems || selectedItems.length === 0 )
      {
        alert( page.bundle.getString( "admin.manageuserlists.selectionwarning" ) );
        return;
      }
      selectedItems.invoke( "remove" );
      selectedItems.each( function( item )
      {
        rightItems.push( item );
      } );
      rightItems = rightItems.sortBy( function( option )
      {
        return option.getAttribute( "sortString" );
      } );
      rightItems.each( function( item )
      {
        this.rightSelectBox.appendChild( item );
      }.bind( this ) );
      this.setHiddenValues();
      if ( this.rightClickListeners )
      {
        this.rightClickListeners.each( function( listenerFunc )
        {
          listenerFunc.apply( this, selectedItems );
        }.bind( this ) );
      }
    },

    setHiddenValues : function()
    {

      var leftString;
      var rightString;
      var temp = "";

      // Populate select box values comma separated into leftString,rightString.
      if ( this.leftSelectBox )
      {
        this.leftSelectBox.immediateDescendants().each( function( option )
        {
          leftString = option.value;
          temp += leftString + ",";
        } );
        temp = temp.substring( 0, temp.length - 1 );
        temp = temp.replace( /^\s*|\s*$/g, "" );
        this.leftValues.value = temp;
        temp = "";
      }
      if ( this.rightSelectBox )
      {
        this.rightSelectBox.immediateDescendants().each( function( option )
        {
          rightString = option.value;
          temp += rightString + ",";
        } );
        temp = temp.substring( 0, temp.length - 1 );
        temp = temp.replace( /^\s*|\s*$/g, "" );
        this.rightValues.value = temp;
        temp = "";
      }
    },

    onSelectAllClick : function( event, isLeft )
    {
      if ( isLeft )
      {
        this.leftSelectBox.immediateDescendants().each( function( option )
        {
          option.selected = true;
        } );
      }
      else
      {
        this.rightSelectBox.immediateDescendants().each( function( option )
        {
          option.selected = true;
        } );
      }
      Event.stop( event );
    },

    onInvertSelection : function( event, isLeft )
    {
      if ( isLeft )
      {
        this.leftSelectBox.immediateDescendants().each( function( option )
        {
          option.selected = !option.selected;
        } );
      }
      else
      {
        this.rightSelectBox.immediateDescendants().each( function( option )
        {
          option.selected = !option.selected;
        } );
      }
    }
};

/**
 * A dynamic picker list
 */
widget.PickerList = Class.create();
widget.PickerList.prototype =
{
    /**
     * Creates a new picker list
     *
     * @param id id of the picker list table
     * @param cellGenerators an array of functions to be called to generate the HTML for the cells for a new row in the
     *          table.
     * @param columnAlignments an array of the alignments of the columns
     * @param columnStyles optional styles to applied to columns
     * @param reorderable whether the table is to be reorderable
     * @param reorderingUrl url that reordering changes will be persisted to (can be null)
     * @param contextParameters parameters that are passed along with the reordering action.
     */
    initialize : function( id, cellGenerators, columnAlignments, columnStyles, reorderable, reorderingUrl,
                           contextParameters )
    {
      this.table = $( id );
      this.reorderable = reorderable;
      if ( this.table )
      {
        this.tableBody = $( this.table.getElementsByTagName( 'tbody' )[ 0 ] );
        if ( reorderable )
        {
          this.dragDrop = new dragdrop.ListReordering( this.tableBody, this.table.id + '_reorderControls', false, 'tr',
                                                       'dndHandle', 'span', reorderingUrl, contextParameters,
                                                       new Date().getTime(), null );
        }
      }
      this.cellGenerators = cellGenerators;
      this.columnAlignments = columnAlignments;
      this.columnStyles = columnStyles;
    },

    /**
     * This function takes any number of arguments. They will be passed directly to the generator functions. If this
     * list is reorderable, the first two arguments must be: - id of the item added. - name of the item added.
     */
    addRow : function()
    {
      var generatorArgs = arguments;
      var row = $( document.createElement( "tr" ) );
      if ( this.reorderable )
      {
        dragdrop.ListReordering.addDivs(); // Temporarily add the accessible controls to the dom
        var id = arguments[ 0 ];
        var name = arguments[ 1 ];
        // Set the row id so that the drag and drop code can identify the row
        row.id = this.table.id + '_row:' + id;
        // Add the reordering handle.
        var cell = document.createElement( "td" );
        cell.className = 'smallCell dndHandle';
        cell.valign = 'top';
        cell.innerHTML = '<span class="reorder"><span><img src="' + getCdnURL( "/images/ci/icons/generic_updown.gif" ) + '" alt="" /></span></span>';
        row.appendChild( cell );
        // Add the item to the accessible controls.
        var accessibleSelect = $( this.table.id + "_reorderControlsSelect" );
        accessibleSelect.options[ accessibleSelect.length ] = new Option( name, id );
        dragdrop.ListReordering.removeDivs(); // Remove the accessible controls from the dom again.
      }
      this.cellGenerators.each( function( generator, index )
      {
        var alignment = this.columnAlignments[ index ];
        var cell = $( document.createElement( "td" ) );
        cell.setAttribute( "align", alignment );
        var columnStyle = this.columnStyles[ index ];
        if ( '' != columnStyle )
        {
          cell.addClassName( columnStyle );
        }
        cell.innerHTML = generator.apply( window, generatorArgs );
        row.appendChild( cell );
      }.bind( this ) );
      if ( generatorArgs[ 0 ] && generatorArgs[ 0 ].incompatibleFile )
      {
        return;
      }
      else
      {
        this.tableBody.appendChild( row );
      }
      if ( this.reorderable )
      {
        // Toggle drag and drop so that it picks up the new item.
        this.dragDrop.disableDragAndDrop();
        this.dragDrop.enableDragAndDrop();
        this.dragDrop.calculateItemOrder();
      }
      return row;
    },
    /**
     * Removes the row with the specified id or index
     *
     * @param idOrIndex - if the argument is a string - it is taken as the id of one of the rows in the table - if the
     *          argument is a number - the row at the specified index will be removed.
     */
    removeRow : function( idOrIndex )
    {
      var rowToRemove = null;
      if ( Object.isString( idOrIndex ) )
      {
        rowToRemove = $( this.table.id + "_row:" + idOrIndex );
      }
      else
      {
        rowToRemove = this.tableBody.childElements()[ idOrIndex ];
      }
      if ( rowToRemove )
      {
        // Remove the row from the accessible repositioning controls if applicable
        if ( this.reorderable )
        {
          dragdrop.ListReordering.addDivs(); // Temporarily add the accessible controls to the dom
          var idToCheck = rowToRemove.id.split( ':' )[ 1 ];
          var accessibleSelect = $( this.table.id + "_reorderControlsSelect" );
          var options = accessibleSelect.childElements();
          for ( var i = 0; i < options.length; i++ )
          {
            if ( options[ i ].value == idToCheck )
            {
              Element.remove( options[ i ] );
              break;
            }
          }
          dragdrop.ListReordering.removeDivs(); // Remove the accessible controls from the dom again.
        }
        Element.remove( rowToRemove );
        if ( this.reorderable )
        {
          this.dragDrop.calculateItemOrder();
        }
      }
    }
};
widget.PickerList.noopGenerator = function()
{
  return '&nbsp;';
};

/**
 * File picker
 */
widget.FilePicker = Class.create();
// The values of the following are assigned in FilePickerTag.
widget.FilePicker.CLOUDSTORAGEINTEGRATION_APP_ID = null;
widget.FilePicker.CLOUDSTORAGEINTEGRATION_BASE_URL = null;
widget.FilePicker.CLOUDSTORAGEINTEGRATION_USE_LOADER_EXPLORER = null;
widget.FilePicker.COURSE_ID = null;

const FILE_PICKER_ATTACH_TYPE_LOCAL = 'L';
const FILE_PICKER_ATTACH_TYPE_CONTENT_SYSTEM = 'C';
const FILE_PICKER_ATTACH_TYPE_CLOUD = 'CL';
const BROWSER_VALIDATION_SHOWN_ONCE_KEY = "isSessionFirstTimeBrowserValidation";
widget.FilePicker.prototype =
{
    /**
     * Creates a new file picker
     *
     * @param pickerList the javascript object representing the picker list (of currently attached files)
     * @param baseElementName the base name for the file picker elements
     * @param required whether a file is required to be chosen
     * @param overrideLocalBehavior whether the CS options to override local behavior should be shown
     * @param csPickerUrl url to the CS file picker
     * @param showAddMetadata whether the "submit and add metadata" content system functionality should be enabled.
     * @param allowMultipleFiles allow attaching multiple CS and local files.
     *   Note, local files are picked one at a time using the browser file picker.  Picking multiple local files at the
     *   same time is not enabled.
     * @param onAttachFile Optional callback function triggered when a new file is attached
     * @param allowMultipleLocalFileUpload whether multiple local file upload selection is enabled.  Local multiple
     *   files can be picked  using drag and drop or using the browser file picker by holding down the shift key and
     *   making multiple selections.
     * @param allowCloudFileSelection whether to allow the user to pick files from the Cloud.
     * @param locale the locale used by file explorer, the format is <language>_<country_code>, e.g. en_US
     * @param showHTMLFileTypeWarning If true shows HTML warning when HTMLfile type is picked from local file system
     * @param isForVtbeAddFromDialog Whether the file picker is launched from the VTBE's Add File Dialog.
     * @param enforceMaxFileUploadSize Whether to enforce max file upload size.
     */
    initialize : function( pickerList, baseElementName, required, overrideLocalBehavior, csPickerUrl, showAddMetadata,
                           showSpecialAction, allowMultipleFiles, onAttachFile, allowMultipleLocalFileUpload,
                           allowCloudFileSelection, locale, showHTMLFileTypeWarning, isForVtbeAddFromDialog, enforceMaxFileUploadSize )
    {
      this.pickerList = pickerList;
      this.baseElementName = baseElementName;
      this.required = required;
      this.overrideLocalBehavior = overrideLocalBehavior;
      this.csPickerUrl = csPickerUrl;
      this.showAddMetadata = showAddMetadata;
      this.showSpecialAction = showSpecialAction;
      this.allowMultipleFiles = allowMultipleFiles;
      this.allowMultipleLocalFileUpload = allowMultipleLocalFileUpload;
      this.showHTMLFileTypeWarning = showHTMLFileTypeWarning;
      this.allowCloudFileSelection = allowCloudFileSelection;
      this.locale = locale;
      this.onAttachFile = onAttachFile;
      this.tokenPrefKey = 'cloud.account.tokens';
      this.userPrefUrl = '/learn/api/v1/users/me/preferences/' + this.tokenPrefKey;

      this.pickCSButton = $( this.baseElementName + '_csBrowse' );
      this.pickLocalButton = $( this.baseElementName + '_localBrowse' );
      this.localFilePicker = $( this.baseElementName + '_chooseLocalFile' );
      this.cloudFilePicker = $( this.baseElementName + '_cloudBrowse' );

      this.pickURLButton = $( this.baseElementName + '_urlBrowse' );

      this.selectedCSFile = $( this.baseElementName + '_selectedCSFile' );
      this.selectedCSFileName = $( this.baseElementName + '_selectedCSFileName' );
      this.selectedCSFilePath = $( this.baseElementName + '_selectedCSFilePath' );
      this.selectedCSFileSize = $( this.baseElementName + '_selectedCSFileSize' );
      if ( this.showAddMetadata )
      {
        this.selectedCSFileMetadata = $( this.baseElementName + '_selectedCSFileMetadata' );
        this.selectedCSFileMetadataSync = $( this.baseElementName + '_selectedCSFileMetadataSync' );
        this.selectedCSFileMetadataFormat = $( this.baseElementName + '_selectedCSFileMetadataFormat' );
      }

      // single file selected area
      this.selectedFileActionsArea = $( this.baseElementName + '_selectedFileActions' );
      if( this.showHTMLFileTypeWarning )
      {
       this.selectedFileHTMLWarningArea = $( this.baseElementName + '_warning' );
      }
      this.selectCSPermissionsLiArea = $( this.baseElementName + '_csPermissionsLi' );
      this.selectedFileName = $( this.baseElementName + '_selectedFileName' );
      this.selectedFileSource = $( this.baseElementName + '_selectedFileSource' );
      this.selectedFileLinkTitle = $( this.baseElementName + '_selectedFileLinkTitle' );
      this.selectedFileSpecialAction = $( this.baseElementName + '_selectedFileSpecialAction' );
      this.attachFileButton = $( this.baseElementName + '_attachFileButton' );
      this.cancelFileButton = $( this.baseElementName + '_cancelFileButton' );

      this.allowCS = this.pickCSButton ? true : false;
      this.allowLocal = this.pickLocalButton ? true : false;
      this.allowURL = this.pickURLButton ? true : false;
      this.isForVtbeAddFromDialog = isForVtbeAddFromDialog;

      // lookup for new local files (locally generated id -> file)
      this.localFileLookup = {};

      // Names of files that exceeded max upload size
      this.filesExceedingMaxFileUploadSize = [];
      // Whether enforcing max file upload size is enabled
      this.enforceMaxFileUploadSize = enforceMaxFileUploadSize;

      // Count to keep track of the number of files are currently being downloaded from the Cloud.
      this.numFilesBeingDownloadedFromCloud = 0;

      // Wire up events
      if ( this.overrideLocalBehavior )
      {
        this.pickTargetButton = $( this.baseElementName + '_CSTargetButton' );
        this.targetCSLocation = $( this.baseElementName + '_CSTarget' );
        Event.observe( this.pickTargetButton, "click", this.onPickTargetClick.bindAsEventListener( this ) );
      }

      this.pickMDButton = $( this.baseElementName + '_CSTargetMetaButton' );
      if ( this.pickMDButton )
      {
        window.CSMetadataPickerCallBack = this.afterPickMD.bind( this );
        Event.observe( this.pickMDButton, "click", this.onPickMDClick.bindAsEventListener( this ) );
      }
      if ( $( this.baseElementName + '_permissionPickerButton0' ) )
      {
        Event.observe( $( this.baseElementName + '_permissionPickerButton0' ), "click",
                       widget.FilePicker.openPermPicker
                           .bindAsEventListener( this, this.csPickerUrl, this.baseElementName + "_permissions0_manual",
                                                 this.selectedCSFilePath, this.selectedCSFile, widget.FilePicker.permPickerCallback
                                                     .curry( this.baseElementName,
                                                             this.baseElementName + '_csPermFileList0', 0 ) ) );
      }
      if ( this.allowCS )
      {
        if ( this.isForVtbeAddFromDialog )
        {
          Event.observe( this.pickCSButton, "click", this.onCSBrowseVtbeEmbed.bindAsEventListener( this ) );
        }
        else
        {
          Event.observe( this.pickCSButton, "click", this.onCSBrowse.bindAsEventListener( this ) );
        }
        Event.observe( this.selectedCSFile, "change", this.onCSPick.bindAsEventListener( this ) );
      }
      if ( this.allowLocal )
      {
        this.localFileContainer = this.localFilePicker.up();
        Event.observe( this.localFilePicker, "change", this.onLocalPick.bindAsEventListener( this ) );
      }
      if ( this.allowURL )
      {
        this.linkId = $( this.baseElementName + "_urlBrowse" );
        this.formDivId = $( this.baseElementName + "_addUrlForm" );
        this.formContainerId = $( this.baseElementName + "_urlContainerDiv" );
        var flyout = new flyoutform.FlyoutForm(
        {
            linkId : this.linkId,
            formDivId : this.formDivId,
            inlineFormContainerId : this.formContainerId,
            customCallbackObject : this,
            customOnSubmitHandler : this.onURLPick
        } );
        this.flyout = flyout;
      }

      if ( this.cancelFileButton )
      {
        Event.observe( this.cancelFileButton, "click", this.onCancelClick.bindAsEventListener( this ) );
      }

      if (this.allowLocal || this.allowCS)
      {
        var filePickerObj = this;
        doubleSubmit.registerFormSubmitEvents(this.allowLocal ? this.pickLocalButton.form : this.pickCSButton.form, function(event){
          return filePickerObj.onSubmit(event);
        });
      }

      this.listHtmlDiv = $( this.baseElementName + "_listHtmlDiv" );

      if ( !this.isForVtbeAddFromDialog && this.listHtmlDiv && this.pickerList && this.pickerList.tableBody && ( this.pickerList.tableBody
          .getElementsBySelector( 'input[type="hidden"]' ).length > 0 || this.pickerList.tableBody
          .getElementsBySelector( 'input[type="file"]' ).length > 0 ) )
      {
        this.listHtmlDiv.show();
      }

      if ( !this.allowMultipleFiles && this.selectedFileSource.value != '' )
      {
        // A file is already attached, so show the selected files area and
        // turn off the file choosing button (and metadata button if any).
        this.selectedFileActionsArea.show();
        this.togglePickerButtons( false );
        if ( this.pickMDButton )
        {
          this.pickMDButton.hide();
        }
      }

      // Setup multiple local file upload if enabled.
      // When the filePicker is used for the VTBE's add-content dialog, drag and drop is not supported.  Only multiple local file upload
      // via the browser's file picker is supported.
      if ( !this.isForVtbeAddFromDialog && this.allowMultipleLocalFileUpload  )
      {
        $j( document ).on( 'drop dragover', function ( e ) {
          // prevent default behavior of dropping a file onto the page opening the file
          // in the current window
          e.preventDefault();
        });

        var dropZoneArea = document.getElementById( 'bbFilePicker_dropzone_' + this.baseElementName );
        var that = this;
        $j( dropZoneArea ).fileupload(
        {
          autoUpload: false, /* do not upload after each file selection */
          drop : function( e, data )
          {
            e.dataTransfer = {};
            e.dataTransfer.files = data.files;
            that.onLocalPick( e );
          }
        } );

        // setup drop effect
        $j( document ).on( 'dragover', function( e )
        {
          var dropZone = $j( dropZoneArea ), timeout = window.dropZoneTimeout;
          if ( !timeout )
          {
            dropZone.addClass( 'in' );
          }
          else
          {
            clearTimeout( timeout );
          }
          var found = false, node = e.target;
          do
          {
            if ( node === dropZone[ 0 ] )
            {
              found = true;
              break;
            }
            node = node.parentNode;
          } while ( node != null );
          if ( found )
          {
            dropZone.addClass( 'hover' );
          }
          else
          {
            dropZone.removeClass( 'hover' );
          }
          window.dropZoneTimeout = setTimeout( function()
          {
            window.dropZoneTimeout = null;
            dropZone.removeClass( 'in hover' );
          }, 100 );
        } );
      }

      if ( this.allowCloudFileSelection )
        {
          try {
            // Create an instance of the Cloud Storage Integration File browser JS Object.
            if ( window.CloudStorageIntegration && window.CloudStorageIntegration.explorer ) {

              this.explorer = window.CloudStorageIntegration.explorer({
                app_id: widget.FilePicker.CLOUDSTORAGEINTEGRATION_APP_ID,
                retrieve_token: true,
                persist: 'none',
                multiselect: this.allowMultipleFiles,
                display_backdrop: true,
                create_folder: false,
                types: ['files'],
                base_url: widget.FilePicker.CLOUDSTORAGEINTEGRATION_BASE_URL,
                use_loader_explorer: widget.FilePicker.CLOUDSTORAGEINTEGRATION_USE_LOADER_EXPLORER,
              });

              var that = this;

              // When user clicks the 'Browse Cloud Service' button, launch the Cloud Storage Integration file browser.
              $j( '#' + this.baseElementName + '_cloudBrowse' ).on('click',function() {
                $j.ajax({
                  url: that.userPrefUrl,
                  contentType: 'application/json',
                  type: 'GET',
                  success: function(response) {
                    let tokens = [];
                    JSON.parse(response.value).forEach(function(account) {
                      tokens.push(account.bearer_token.key);
                    });
                    that.explorer.update({ locale: that.locale.toLowerCase().replace(/_/g,'-'), tokens: tokens });
                    that.explorer.choose();
                  },
                  error: function(data) {
                    // Couldn't load the preference
                    that.explorer.update({ locale: that.locale.toLowerCase().replace(/_/g,'-'), tokens: [] });
                    that.explorer.choose();
                  }
                });
              });

              // Tell Cloud Storage Integration file browser to call our callback function, onCloudFilesPick(), when a user
              // selects a file from the file browser.
              this.explorer.on('success', function(files) {
                  that.onCloudFilesPick( files );
                });

              this.explorer.on( 'close', function ()
              {
                that.onClose();
              } );

              this.explorer.on( 'open', function ()
              {
                that.onOpen();
              } );
            }
          } catch ( e ) {
            console.log(e);
          }
        }

      widget.FilePicker.registerFilePicker( this );
    },

    getPickedFiles : function( theForm )
    {
      var newLocalFileIndex = 0;
      var newLocalFilesArray = new Array();
      $j(this.pickerList.tableBody).find( "input[name='" + this.baseElementName + "_attachmentType']" ).each( function( index, item )
      {
        // Add the new local files to the XHR POST
        if (item.value === FILE_PICKER_ATTACH_TYPE_LOCAL)
        {
          var theRow = $j(item).closest( 'tr' )[0];
          var localFileId = theRow.dataset.bbLocalFileId;
          if ( localFileId )
          {
            var theFileObject = window[ this.baseElementName + '_FilePickerObject'].localFileLookup[ localFileId ];
            if ( theFileObject )
            {
              // add the new local file to the form
              // e.g. 'newFile_LocalFile0'
              var inputLocalFileName = this.baseElementName + '_LocalFile' + newLocalFileIndex;
              newLocalFilesArray.push( {'name': inputLocalFileName, 'file': theFileObject } ) ;

              // MSIE workaround:
              // MSIE 11 HTML 5 FormData only supports append(), but not set().  The latter replaces any pre-existing
              // form element with the same name, while append does not.
              // For XHR local file uploads to work, we need to simulate that behavior ourselves by renaming any pre-existing
              // file input elements to a dummy name to avoid collisions when we add our final list of local file uploads to the FormData.
              var existingElement = document.getElementsByName( inputLocalFileName );
              if ( existingElement.length > 0 )
              {
                existingElement[0].name='anythingButCurrentName';
              }
              ++newLocalFileIndex;
            }
          }
        }
      }.bind( this ) );

      return newLocalFilesArray;
    },

    /**
     * Creates a FormData object with the values of the specified form and also adds the local files to upload. This
     * FormData object is returned to the caller to submit via Ajax upload.
     */
    preparePickedFilesForSubmit : function( theForm )
    {
      var newLocalFilesArray = this.getPickedFiles( theForm );
      // Add the final list of local files to upload to the FormData
      var formData = new FormData( theForm );
      //LRN-135846, Client side failure occurs when processing empty file type elements. Removing before processing
      $j("input[type=file]").each(function() {
          if($j(this).val() === "" && typeof(formData.delete) === 'function' ) {
              formData.delete($j(this).attr("name"));
          }
      });
      $j( newLocalFilesArray ).each( function( index, fileInfo )
      {
        formData.append( fileInfo.name, fileInfo.file );
      } );
      return formData;
    },

    /**
     * Submits the specified form including picked local files.
     *
     * @param theForm that contains the data and the action of the request.
     * @param errorMsg to show in case the form submission fails.
     * @param sendBeacon - set to true to use the navigator.sendBeacon API. This API is useful to send data when
     * a page is closing, however, don't use it for critical submissions, it is not 100% reliable.
     *
     * Successful form submission responses may include one of the following:
     *    destinationUrl - redirect to destinationUrl
     *    htmlOutput - deposit htmlOutput into current document
     *    JSCallBack - invoke JSCallBack function. JSCallBack may contain '.' i.e.: "edit_assignment.afterSubmit"
     *    errorMap - mapped localized error messages to filenames are added as error InlineConfirmation
     *
     *
     *   If error or unrecognized response occurs, an InlineConfirmation is displayed with errorMsg and checks
     *    if is also a VTBE add dialog and close the modal sending the error message to parent page
     *
     */
    submitFormUsingAjax : function( theForm, errorMsg, sendBeacon )
    {
      // prevent double submit
      if ( doubleSubmit && doubleSubmit.handleFormSubmitEvents( null, theForm, null ) === false )
      {
        return;
      }

      // Ensure all VTBE text is copied over from the VTBE into their respective textareas
      if ( typeof( finalizeEditors ) == "function" )
      {
        finalizeEditors();
      }

      // When submitting a form with local file upload using AJAX, we attach files directly using Javascript 
      // in preparePickedFilesForSubmit(), so we don't use files attached to the HTML file input tags, which causes
      // the files to be uploaded twice.  To fix the issue, we need to delete the HTML file input tag.
      $j('.hiddenBbLocalFilePicker').remove();

      var filePickerLastInputId = this.baseElementName +"_" + 'filePickerLastInputId';
      if ( !document.getElementById( filePickerLastInputId  ) )
      {
        /**
         * Workaround to avoid corrupted XHR2 request body in MSIE 11.
         * In MSIE, XHR2 submits fail if the last form element is an unchecked chedkbox.
         * Add dummy element to bypass this issue.
         */
        var input = document.createElement('input');
        input.setAttribute("id", filePickerLastInputId);
        input.setAttribute("type", "hidden");
        input.setAttribute("value", 'dummyValue');
        input.setAttribute("name", this.baseElementName + 'filePickerLastInput' );
        theForm.appendChild(input);
      }

      var data = this.preparePickedFilesForSubmit( theForm );
      var that = this;

      this.wasCannotPickFolderDialogAlreadyShown = false;
      // use origin[0] in order to get the origin for html messages
      const origin = this.getBaseUrl();
      if ( this.isForVtbeAddFromDialog )
      {
        window.parent.postMessage({
          mceAction: 'block',
          message: page.bundle.getString( 'filePicker.pickedFile.adding.file' )
        }, origin[0] );
      }

      if( sendBeacon )
      {
        navigator.sendBeacon(theForm.action, data);
        return;
      }
      $j.ajax(
      {
          url : theForm.action,
          data : data,
          processData : false,
          contentType : false,
          type : 'POST',
          success : function( response )
          {
            if ( response.destinationUrl )
            {
              // Redirect to URL
              window.location.href = response.destinationUrl;
            }
            else if (response.htmlOutput )
            {
              // replace window contents with specified HTML
              document.body.innerHTML = response.htmlOutput;
              page.globalEvalScripts( response.htmlOutput, false );
            }
            else if ( response.JSCallBack )
            {
              try
              {
                var methods = response.JSCallBack.split(".");
                var f = window;
                for (var i = 0; i < methods.length; i++) {
                    f = f[methods[i]];
                }
                f();
              }
              catch( err )
              {
                new page.InlineConfirmation( "error", err.message, false, true );
              }
            }
            else
            {
              if ( doubleSubmit )
              {
                doubleSubmit.allowSubmitAgainForForm( theForm );
              }
              if ( response.errorMap )
              {
                for (var key in response.errorMap)
                {
                  new page.InlineConfirmation( "error", key + " " + response.errorMap[key], false, true );
                }
              }
              else
              {
                that.handleAjaxSubmitUnexpectedError( errorMsg, that.isForVtbeAddFromDialog,  origin[0] );
              }
              if ( response.nonceId && theForm.elements['blackboard.platform.security.NonceUtil.nonce'] )
              {
                theForm.elements['blackboard.platform.security.NonceUtil.nonce'].value = response.nonceId;
              }
            }

            if ( that.isForVtbeAddFromDialog )
            {
              window.parent.postMessage( {
                mceAction: 'unblock'
              }, origin[0] );
              // Do not close Insert BB Content TinyMCE Dialog - needs to stay open for HTML snippet to be inserted
            }
          }.bind( this ),
          error : function( data )
          {
            if ( doubleSubmit )
            {
              doubleSubmit.allowSubmitAgainForForm( theForm );
            }
            that.alertIfUserAddedFolderUsingSafari();
            that.handleAjaxSubmitUnexpectedError( errorMsg, that.isForVtbeAddFromDialog, origin[0] );
          }
      } );
    },

    /**
     * Handles unrecognized response occurs for ajax calls.
     *
     * An InlineConfirmation is displayed with errorMsg and check if is also a VTBE add dialog and close the modal
     * sending the error message to parent page.
     *
     * @param errorMsg message string to show.
     * @param isForVtbeAddFromDialog flag to confirm if is a Vtbe add dialog.
     * @param origin caller
     */
    handleAjaxSubmitUnexpectedError: function (errorMsg, isForVtbeAddFromDialog, origin)
    {
      if (isForVtbeAddFromDialog)
      {
        new window.parent.page.InlineConfirmation("error", errorMsg, false, true);
        window.parent.postMessage( {
          mceAction: 'closeAddContentDialog'
        }, origin);
      }
      else
      {
        new page.InlineConfirmation("error", errorMsg, false, true);
      }
    },

    getBaseUrl: function()
    {
      return window.location.href.match(/^[a-z]+:\/\/[^\/]+/);
    },
    // Safari makes it appear as if you can drop a folder but when it throws an error once you try to read from the inputstream.
    // This function checks for that case here: if it is, show an alert box asking
    // the user to remove any possible folders.  This quirk only occurs for Safari.  Chrome does support folder drops, and MSIE
    // an FF ignore folder drops.
    alertIfUserAddedFolderUsingSafari: function()
    {
      var attachmentLookupMap = this.localFileLookup;
      var hasPossibleFolder = false;
      var isSafari = this.isSafari();
      if ( isSafari )
      {
        var that = this;
        // Check whether any of the picked local files could be folders.  Stop looking once we find a folder.
        for (var key in attachmentLookupMap) {
          if ( attachmentLookupMap.hasOwnProperty(key) )
          {
            var file = attachmentLookupMap[ key ];
            reader = new FileReader();
            reader.onerror = function (event) {
              if (!that.wasCannotPickFolderDialogAlreadyShown )
              {
                // User picked a folder using Safari.  Show an alert and set a flag.
                that.wasCannotPickFolderDialogAlreadyShown = true;
                alert( page.bundle.getString( 'filePicker.localPickedFile.error.safari.possibleFolder' ) );
              }
            };
            // Try reading the first 2 bytes to check whether we can actually read the file.
            // Note: readAsText is an asynchronous call, so the read operation  run any time during or after this for loop is completed.
            // As a result, we can't do things like break the loop if an error occurs.
            // To get results of readAsText() we rely on the above onerror function callback.
            reader.readAsText(file.slice( 0, 2) );
          }
        }
      }
    },

    isSafari: function()
    {
      return navigator.vendor.indexOf("Apple")==0 && /\sSafari\//.test(navigator.userAgent);
    },

    /**
     * For the override local behavior: show the picker to pick the location
     */
    onPickTargetClick : function( event )
    {
      var remote = popop.launchPicker( '/webapps/cmsmain/folderpicker/', 'picker_browse' );
      if ( remote )
      {
        remote.opener.inputEntryURLToSet = this.targetCSLocation;
        remote.opener.returnFullURL = false;
        remote.methodCall = this.onPickMDClick.bind( this );
      }
    },

    /**
     * For the override local behavior: show the picker to pick the metadata
     */
    onPickMDClick : function( event )
    {
      var location = this.targetCSLocation;
      var file = this.localFilePicker;
      if ( file.value == '' )
      {
        return;
      }
      var url = '/webapps/cmsmain/execute/metadatapicker/manage?action=pick&file=' + file.value;
      if ( location && location.value != '' )
      {
        url += 'location=' + location.value;
      }

      popup.launchPicker( url, 'picker_browse' );
    },

    /**
     * For the override local behavior: callback from the metadata picker
     */
    afterPickMD : function( metadata, selection, synchronised, format )
    {
      $( this.baseElementName + '_CSTargetmetadata' ).value = metadata;
      $( this.baseElementName + '_CSTargetselection' ).value = selection;
      $( this.baseElementName + '_CSTargetSynchronised' ).value = synchronised;
      $( this.baseElementName + '_CSTargetDisplayFormat' ).value = format;
    },

    /**
     * Show the CS file chooser
     */
    onCSBrowse : function( event )
    {
      this.csBrowseWindow = null;
      var windowId = new Date().getTime();
      var myLightbox = new lightbox.Lightbox(
      {
          lightboxId : windowId,
          dimensions :
          {
              w : 1200,
              h : 675
          },
          title : page.bundle.getString( 'lightbox.title' ),
          ajax :
          {
              url : this.csPickerUrl,
              loadExternalScripts : true
          },
          closeOnBodyClick : false,
          msgs :
          {
            'close' : page.bundle.getString( 'lightbox.close' )
          }
      } );

      myLightbox.resourcePickerCustomHandler = this.onCSPick.bind( this );

      if ( !this.allowMultipleFiles )
      {
        // only used for single resource picking
        myLightbox.resourcePickerProperties =
        {};
        myLightbox.resourcePickerProperties.inputEntryURLToSet = this.selectedCSFile;
        myLightbox.resourcePickerProperties.inputFileSizeToSet = this.selectedCSFileSize;
        myLightbox.resourcePickerProperties.linkName = this.selectedCSFileName;
        if ( this.selectedCSFilePath )
        {
          myLightbox.resourcePickerProperties.filePath = this.selectedCSFilePath;
        }
      }
      myLightbox.open();
      Event.stop( event );
      return false;
    },

    onCSBrowseVtbeEmbed: function ( event )
    {
      var windowManager = parent.tinymce.activeEditor.windowManager;

      // Do not close the Insert BB Content dialog - it contains the form and its input elements.

      // Open a new dialog to pick from content collection
      let title = page.bundle.getString( 'lightbox.title' );
      var newWindow = windowManager.openUrl( {
        title: title,
        url: this.csPickerUrl,
        onMessage: function ( dialogApi, details ) {
          if ( details.mceAction === "insertFromContentCollectionPicker" )
          {
            // Populate the form elements with the data we got back from the content collection picker
            this.onCSPick( details.data.pickerItemList );

            // Submit the form
            if ( window.ajaxCanSubmitInsertForm && window.ajaxCanSubmitInsertForm() )
            {
              this.submitFormUsingAjax( this.pickCSButton.up( 'form' ),
                page.bundle.getString( 'content.add.file.failure' ) );
              Event.stop( event );
            }

            // close content collection choose dialog
            if ( windowManager )
            {
              windowManager.close();
            }
          }
        }.bind( this ),
        onClose: function ()
        {
          this.pickCSButton.focus();
        }.bind(this),
      } );

      let dialogIframe = this.findLaunchedDialogIframe( title );

      // Set focus inside the dialog and add a new event to handler the ESC key to
      // close the dialog. This is going to be executed when the dialog is loaded.
      dialogIframe.onload = function ()
      {
        this.contentWindow.document.querySelector( 'a.active[tabindex="1"]' ).focus();
        this.contentWindow.document.addEventListener( 'keydown', function ( e )
        {
          if ( e.keyCode === Event.KEY_ESC )
          {
            newWindow.close();
          }
        }, false );
      }
    },

    /**
     * Called after file has been chosen from CS file picker with metadata added.
     */
    afterMD : function( metadata, synced, format, fileId )
    {
      var metadataString = metadata.join( "#" );

      if ( fileId )
      {
        if ( $( this.baseElementName + '_CSMetadata_' + fileId ) )
        {
          $( this.baseElementName + '_CSMetadata_' + fileId ).value = metadataString;
        }
        if ( $( this.baseElementName + '_CSMetadataSync_' + fileId ) )
        {
          $( this.baseElementName + '_CSMetadataSync_' + fileId ).value = synced;
        }
        if ( $( this.baseElementName + '_CSMetadataFormat_' + fileId ) )
        {
          $( this.baseElementName + '_CSMetadataFormat_' + fileId ).value = format;
        }
      }
      else
      {
        if ( this.selectedCSFileMetadata )
        {
          this.selectedCSFileMetadata.value = metadataString;
        }
        if ( this.selectedCSFileMetadataSync )
        {
          this.selectedCSFileMetadataSync.value = synced;
        }
        if ( this.selectedCSFileMetadataFormat )
        {
          this.selectedCSFileMetadataFormat.value = format;
        }
      }
    },

    /**
     * Callback called after a file has been chosen from the CS file picker in single file mode - updating selected
     * files section
     */
    onCSPick : function( fileList )
    {
      if ( this.listHtmlDiv )
      {
        if ( this.isForVtbeAddFromDialog )
        {
          // Make sure the picked files list is hidden.  For the VTBE add-content dialog, we want to have the dialog close after
          // the user picks files, without any further UI interaction.
          this.listHtmlDiv.hide();
        }
        else
        {
          this.listHtmlDiv.show();
        }
      }

      if ( this.allowMultipleFiles )
      {
        // picker was opened in multiple mode but one of the legacy page was hit
        // create object cell generator is expecting using hidden input
        if ( typeof ( fileList ) == 'string' )
        {
          var filePath = this.selectedCSFilePath ? this.selectedCSFilePath.value : "";
          var csFile =
          {
              fileName : this.selectedCSFile.value,
              fullUrlToFile : this.selectedCSFile.value,
              linkTitle : this.selectedCSFileName.value,
              filePath : filePath,
              size : this.selectedCSFileSize.value
          };
          this.onCSPickAllowMultiple( [ csFile ] );
        }
        else
        {
          this.onCSPickAllowMultiple( fileList );
        }
      }
      else
      {
        this.csBrowseWindow = null;
        this.selectedFileSource.value = FILE_PICKER_ATTACH_TYPE_CONTENT_SYSTEM;
        this.selectedFileName.innerHTML = this.selectedCSFileName.value;
        if ( this.selectedFileLinkTitle )
        {
          this.selectedFileLinkTitle.value = this.selectedCSFileName.value;
        }
        this.selectedFileActionsArea.show();
        this.togglePickerButtons( false );
        if ( this.pickMDButton )
        {
          this.pickMDButton.hide();
        }
        if ( $( this.baseElementName + '_csPermissionsLi' ) )
        {
          var fileName = this.selectedCSFileName.value;
          var ext = fileName.match( /.*\.(.*)/ );
          ext = ext ? ext[ 1 ] : '';

          // Determine the type of the attached file.
          if ( ( /html|htm/i ).test( ext ) )
          {
            $( this.baseElementName + "_permissionOptionsIndex" ).value = 0;
            $( this.baseElementName + '_csPermissionsLi' ).show();
          }
        }
        if ( this.onAttachFile )
        {
          this.onAttachFile( this, false );
        }
      }
    },

    /**
     * Callback called by Cloud Storage Integration when the user picks a file from the Cloud Storage Integration file browser.
     */
    onCloudFilesPick: function( files )
    {
      let that = this;

      var consistsOfHtmlFile = false;
      let wasCloudFileDownloaded = false;

      // Filter out files exceeding max file limit
      let filteredFiles = $j(files).filter(function (index, file) {
        let shouldIncludeFile = true;
        if ( that.enforceMaxFileUploadSize && ( file.size > fileUploadLimit.FILE_MAX_UPLOAD_SIZE ) )
        {
          that.filesExceedingMaxFileUploadSize.push( file.name );
          --that.numFilesBeingDownloadedFromCloud;
          shouldIncludeFile = false;
        }
        return shouldIncludeFile;
      });

      if ( filteredFiles.length > 0 )
      {
        // Show file download indicator
        this.showCloudFileDownloadIndicator( files, that.isForVtbeAddFromDialog );
      }
      // Process file selections
      filteredFiles.each(function (index, file) {
        let bearerToken = file.bearer_token;
        let id = file.id;
        let accountId = file.account;
        if ( file.name.endsWith('.html') || file.name.endsWith('.htm') )
        {
          consistsOfHtmlFile = true;
        }
        // Show the 'Attached files' mini-list, including the file download indicator, if we
        // start the download process for at least 1 file.
        if ( that.listHtmlDiv && !that.listHtmlDiv.visible() && !that.isForVtbeAddFromDialog )
        {
          that.listHtmlDiv.show();
        }
        // Contact LEARN to download the file(s) from the Cloud.
        that.downloadCloudFileToLearn( file, accountId, id, bearerToken.key, that.isForVtbeAddFromDialog );
        wasCloudFileDownloaded = true;
      });
      if ( wasCloudFileDownloaded )
      {
        // Now that all files are downloaded, make the Ajax call to submit the Add Content dialog form
        if ( this.isForVtbeAddFromDialog )
        {
          // Only perform submission if dependent javascript functions for page execution exists
          if ( window.ajaxCanSubmitInsertForm && window.ajaxCanSubmitInsertForm() )
          {
            var form = this.cloudFilePicker.up('form');
            // Add "baseElementName" for unmarshalling within "InsPictureProcessHelper.initialize"
            this.addBaseElementNameMarker( form, that.baseElementName);
            this.submitFormUsingAjax( form, page.bundle.getString( 'content.add.file.failure' ) );
            Event.stop( event );
          }
        }
      }

      this.showExceedMaxFileUploadSizeDialogIfNeeded( function() {
        if ( parent.window.vtbeUtil )
        {
          parent.window.vtbeUtil.placeFileLimitWarningDialogOnTopIfNeeded();
        }
      }.bind( this ) );

      // Show warning area if the a local/cloud HTML file is included
      if( consistsOfHtmlFile && this.showHTMLFileTypeWarning && !that.isForVtbeAddFromDialog)
      {
        this.selectedFileHTMLWarningArea.show();
      }
    },

    onClose: function() {
      document.activeElement.blur();
      this.cloudFilePicker.focus();
    },

    onOpen: function ()
    {
      let iframe = document.getElementsByClassName( "cloudstorageintegration-modal" )[ 0 ];
      iframe.focus();
    },

  /**
   * Found the iframe of the launched dialog.
   * @param String
   */
  findLaunchedDialogIframe: function ( title )
  {
    const headerClass = 'div.tox-dialog__title';
    let headersNode = window.parent.document.querySelectorAll( headerClass );
    let headersArray = Array.from( headersNode );

    let element = headersArray.find( header => header.innerHTML == title );
    while ( !( element.hasAttribute( 'role' ) && element.getAttribute( 'role' ) == 'dialog' ) )
    {
      element = element.parentElement;
    }
    return element.getElementsBySelector( 'iframe' )[ 0 ];
  },

  /**
     * Show visual indicator to inform user that Cloud file download is in progress.
     */
    showCloudFileDownloadIndicator: function( files, isForVtbeAddFromDialog )
    {
      let fileDownloadInd = $( this.baseElementName + '_loading' );
   	  if ( fileDownloadInd )
      {
		// Show the indicator
		if ( !isForVtbeAddFromDialog )
		{
		  fileDownloadInd.show();
		}
		else
		{
		  var origin = this.getBaseUrl();
		  window.parent.postMessage({
		    mceAction: 'block',
		    message: page.bundle.getString( 'filePicker.localPickedFile.adding.file' )
		  }, origin[0] );
		}
  	    // Keep track of the total number of files being downloaded so that we
        // know when to hide the visual download indicator.
        this.numFilesBeingDownloadedFromCloud = this.numFilesBeingDownloadedFromCloud + files.length;
      }
    },

    /**
     * Hide visual Cloud file download indicator.
     */
    hideCloudFileDownloadIndicator: function( isForVtbeAddFromDialog )
    {
      if ( this.numFilesBeingDownloadedFromCloud > 0 )
      {
        // Decrement the number of files currently being downloaded.
        --this.numFilesBeingDownloadedFromCloud;
      }

   	  if ( this.numFilesBeingDownloadedFromCloud <= 0 )
      {
   		// All files have been downloaded.  Hide the visual download indicator.
   	    let fileDownloadInd = $( this.baseElementName + '_loading' );
     	if ( fileDownloadInd )
        {
     	  if ( !isForVtbeAddFromDialog )
     	  {
     	    fileDownloadInd.hide();
     	  }
     	  else
 		  {
			var origin = this.getBaseUrl();
			window.parent.postMessage({
				mceAction: 'unblock',
				message: page.bundle.getString( 'filePicker.localPickedFile.adding.file' )
				}, origin[0] );
 		  }
        }
     	this.numFilesBeingDownloadedFromCloud = 0;
   	  }
    },

    /**
     * Add baseElementName marker for back-end request unmarshalling.
     */
    addBaseElementNameMarker: function( form, baseElementName )
    {
      var element = document.createElement("INPUT");
      element.setAttribute("type", "hidden");
      element.setAttribute("name", "baseElementName");
      element.setAttribute("value", baseElementName);
      form.appendChild(element);
    },

    /**
     * Contacts LEARN to download the file from the Cloud and save it in a temp location.
     */
    downloadCloudFileToLearn: function( file, accountId, id, bearerToken, isForVtbeAddFromDialog )
    {
      // Escaped pipe character used to separate the 'accountId' from the 'id' of the file to download from the Cloud.
      let pipeSeparator = '%7C';
      // LEARN REST endpoint to download files from the Cloud
      let endpointUrl = '/learn/api/v1/cloudstorages/cloudstorageintegration/contents/' + accountId + pipeSeparator + id + '/download?synchronousDownload=true&accessToken=' + bearerToken;
      if ( widget.FilePicker.COURSE_ID )
      {
        // Add courseId if we have one. This is needed to determine entitlements when do XSS filtering for uploaded files.
        endpointUrl = endpointUrl + '&course_id=' + widget.FilePicker.COURSE_ID;
      }
      let that = this;
      $j.ajax(
      {
        url : endpointUrl,
        // For VTBE, we want to process the download synchronously so that we submit the Add Content dialog
        // only after all files are downloaded.
        async: !isForVtbeAddFromDialog,
        processData : false,
        contentType : false,
        type : 'GET',
        success : function( response )
        {
          that.hideCloudFileDownloadIndicator( isForVtbeAddFromDialog );

          // LEARN file download successful.
          // TODO: response.unencodedFileName is deprecated.  Instead we should be using response.fileName. Deferring
          // this fix to a day when we do not need a patch out the door ASAP.
          let pickedFileObj = { baseElementName: that.baseElementName, wasFileFiltered: response.wasFileFiltered, linkTitle: response.unencodedFileName, fileLocation: response.fileLocation, webLocation: response.webLocation, contentId: response.contentId, shouldManagePermission: false };

          // Add the file attachment to the Attached files' mini-list.
          that.pickerList.addRow( pickedFileObj, FILE_PICKER_ATTACH_TYPE_CLOUD );
          // Wire a listener that will show the embed options when the embed action is chosen (if configured to)
          that.registerEmbedOptionsListener( widget.FilePicker.cellGenerators.fileActionEmbedOptions_index - 1 );
        },
        error : function( data )
        {
          that.hideCloudFileDownloadIndicator( isForVtbeAddFromDialog );

          // Learn file download failed.
          new page.InlineConfirmation( "error", page.bundle.getString( "filePicker.cloud.download.error" ), false, true );
        }
       } );
    },

    /**
     * Called after a file is chosen from the local file picker in single file mode - updating selected files section
     */
    onLocalPick : function( event )
    {
      if ( this.localFilePicker.value != '' || event && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0 )
      {
        if ( this.allowMultipleLocalFileUpload || this.allowMultipleFiles )
        {
          // File Picker allows multiple file picking
          var pickedLocalFiles = null;
          if ( event && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0 )
          {
            // picked files via drag and drop
            pickedLocalFiles = event.dataTransfer.files;
          }
          else
          {
            // picked files via file browser
            pickedLocalFiles = this.localFilePicker.files;
          }
          if ( pickedLocalFiles && pickedLocalFiles.length > 0 )
          {
            var consistsOfHtmlFile = false;
            $A( pickedLocalFiles ).each( function( file, index )
            {
              if ( file.size === 0)
              {
                // If the file is empty don't upload it.
                // Note: In JQuery returning true in a 'each' function is like a 'continue' in a for loop.
                return true;
              }

              if ( this.enforceMaxFileUploadSize && ( file.size > fileUploadLimit.FILE_MAX_UPLOAD_SIZE ) )
              {
                this.filesExceedingMaxFileUploadSize.push( file.name );
                // Note: In JQuery returning true in a 'each' function is like a 'continue' in a for loop.
                return true;
              }

              // When dropping a folder, make sure we only accept files at the top level directory.  We
              // do not accept files from sub-directories (e.g. not f1/f2/foo.html).
              // The following regex counts the number of '/' to ensure we do not have more than one.
              // Note: Directory separators are always '/' for files dropped using the JQuery File Upload API.
              var isSubDirectoryFile = ( file.relativePath && (file.relativePath.match(/\//g) || []).length > 1 );
              if ( isSubDirectoryFile === true )
              {
                // continue the loop to go to the next file.
                // Note: In JQuery returning true in a 'each' function is like a 'continue' in a for loop.
                return true;
              }
              var pickedLocalFile =
              {
                  localFilePicker :
                  {
                    value : file.name
                  },
                  baseElementName : this.baseElementName,
                  getFileName : this.getFileName,
                  shouldManagePermission : this.shouldManagePermission,
                  file: file
              };
              // Determine if it is HTML file
              if ( pickedLocalFile.localFilePicker.value.endsWith('.html') || pickedLocalFile.localFilePicker.value.endsWith('.htm') )
              {
                consistsOfHtmlFile = true;
              }
              // The file passed our criteria so we can now show the listHtmlDiv
              if ( this.isForVtbeAddFromDialog )
              {
                // Make sure the picked files list is hidden.  For the VTBE add-content dialog, we want to have the dialog close after
                // the user picks files, without any further UI interaction.
                this.listHtmlDiv.hide();
              }
              else if ( this.listHtmlDiv && !this.listHtmlDiv.visible() )
              {
                this.listHtmlDiv.show();
              }
              // Replace local file input if this is the last local picked file
              var isReplaceLocalInput = ( ( index + 1 ) === pickedLocalFiles.length );
              this.onLocalPickAllowMultiple( event, pickedLocalFile, isReplaceLocalInput );
            }.bind( this ) );
            // For embedding file into the VTBE from desktop, we want to upload immediately, close the upload file dialog,
            // and insert the files in the VTBE.
            if ( this.isForVtbeAddFromDialog && this.localFileLookup && Object.keys( this.localFileLookup ).length > 0 )
            {
              if ( window.ajaxCanSubmitInsertForm && window.ajaxCanSubmitInsertForm() )
              {
                this.submitFormUsingAjax( this.pickLocalButton.up('form'), page.bundle.getString( 'content.add.file.failure' ) );
                Event.stop( event );
                // Some of those local files selected for upload to VTBE were under the limit and were uploaded to Learn, 
                // while others were over the limit and were not uploaded.  For those over the limit,
                // show the warning dialog.  Note: The Add Content dialog will automatically close itself after uploading 
                // files. We do not need to explicitly close it.
                this.showExceedMaxFileUploadSizeDialogIfNeeded();
                return;
              }
            }

            this.showExceedMaxFileUploadSizeDialogIfNeeded( function() {
              if ( this.isForVtbeAddFromDialog )
              {
                // For VTBE file upload, all the files selected are over the file size limit at this point, 
                // and we need to explicitly close the Add Content dialog.
                parent.window.vtbeUtil.closeActiveDialogWindow();
              }
              else
              {
                // For standalone attachments, at least 1 file picked is over the file size limit.
                // Note: Local file pickers are one-time usage only, and do not work correctly, even when clearing their file state.
                // So, after a local file picker is used, we need to create a new one in its place to allow further picking. 
                this.insertNewLocalFilePickerInstance();
                if ( parent.window.vtbeUtil )
                {
                  parent.window.vtbeUtil.displayFileLimitWarningOverDialogWindow();
                }
              }
            }.bind( this ) );

            // Show warning area if the a local/cloud HTML file is included
            if( consistsOfHtmlFile && this.showHTMLFileTypeWarning )
            {
              this.selectedFileHTMLWarningArea.show();
            }
          }
        }
        else
        {
          // File Picker for standalone attachment only allows single file selection.
          if ( this.enforceMaxFileUploadSize && ( this.localFilePicker.files[0].size > fileUploadLimit.FILE_MAX_UPLOAD_SIZE ) )
          {
            this.filesExceedingMaxFileUploadSize.push( this.localFilePicker.files[0].name );
            this.showExceedMaxFileUploadSizeDialogIfNeeded( function() {
              // Need to set the following line to FILE_PICKER_ATTACH_TYPE_LOCAL for the 
              // onCancelClick() to clear the file selection.
              this.selectedFileSource.value = FILE_PICKER_ATTACH_TYPE_LOCAL;
              this.onCancelClick();
            }.bind( this ) );
            return;
          }
          if( this.selectCSPermissionsLiArea )
          {
            this.selectCSPermissionsLiArea.hide();
          }
          if ( this.listHtmlDiv )
          {
            this.listHtmlDiv.show();
          }
          var localFileName = this.getFileName( this.localFilePicker.value );
          this.selectedFileName.innerHTML = localFileName;
          if ( this.selectedFileLinkTitle )
          {
            this.selectedFileLinkTitle.value = localFileName;
          }
          this.selectedFileSource.value = FILE_PICKER_ATTACH_TYPE_LOCAL;
          this.selectedFileActionsArea.show();
          this.togglePickerButtons( false );
          if ( this.pickMDButton )
          {
            this.pickMDButton.show();
          }
          // Determine if it is local/cloud HTML file if so show the warning area
          if (( localFileName.endsWith('.html') || localFileName.endsWith('.htm')) && this.showHTMLFileTypeWarning )
          {
            this.selectedFileHTMLWarningArea.show();
          }
          if ( this.onAttachFile )
          {
            this.onAttachFile( this, true );
          }
          if ( this.selectedFileLinkTitle )
          {
            this.selectedFileLinkTitle.focus();
          }
        }
      }
    },

    /**
     * Show File Limit Exceeded dialog when at least 1 file selected for upload is over the max file upload size.
     */
    showExceedMaxFileUploadSizeDialogIfNeeded: function( afterDialogShownCallback )
    {
      if ( this.enforceMaxFileUploadSize && this.filesExceedingMaxFileUploadSize.length > 0 )
      { 
        var fileUploadLimitObj = parent && parent.window && parent.window.fileUploadLimit ? parent.window.fileUploadLimit : window.fileUploadLimit;
        fileUploadLimitObj.showFileUploadLimitExceededDialog( this.filesExceedingMaxFileUploadSize );
        this.filesExceedingMaxFileUploadSize.clear();
        if ( afterDialogShownCallback )
        {
          afterDialogShownCallback();
        }
      }
    },

    /**
     * Callback called after files have been chosen from the CS file picker in multiple files mode - updating table
     */
    onCSPickAllowMultiple : function( fileList )
    {
      this.csBrowseWindow = null;

      var removeExisting = document.getElementById('sourceFile_successDIV');
      if (removeExisting != null)
      {
        removeExisting.parentNode.removeChild(removeExisting);
      }

      var msgContainer = new Element( 'div' )
      .update( '<span class="hideoff" tabindex="-1" role="alert" id="sourceFile_success">' + page.bundle.getString( 'content.media.fileSuccess' ) + '</span>' );

      msgContainer.id='sourceFile_successDIV';

      var div = document.getElementById('newFile_listHtmlDiv');
      if(div != null)
      {
        var parentDiv = div.parentNode;
        parentDiv.insertBefore(msgContainer, div);
      }

      var successMsg = document.getElementById('sourceFile_successDIV');
      if( null !== successMsg )
      {
        successMsg.setAttribute('aria-live', 'assertive');
        successMsg.setAttribute('aria-atomic', 'true');
      }

      fileList.each( function( selectedFile )
      {
        selectedFile.baseElementName = this.baseElementName;
        selectedFile.showAddMetadata = this.showAddMetadata;
        selectedFile.csPickerUrl = this.csPickerUrl;
        var rowCheck = document.getElementById(selectedFile.baseElementName + "_rowid_" + selectedFile.xythosId);
        if (rowCheck)
          return;

        var row = this.pickerList.addRow( selectedFile, FILE_PICKER_ATTACH_TYPE_CONTENT_SYSTEM );

        // Wire a listener that will show the embed options when the embed action is chosen (if configured to)
        this.registerEmbedOptionsListener( widget.FilePicker.cellGenerators.fileActionEmbedOptions_index - 1 );

        if ( this.onAttachFile )
        {
          this.onAttachFile( this, false, row );
        }
      }.bind( this ) );
    },

    /**
     * Called after a file is chosen from the local file picker in multiple files mode - updating table
     */
    onLocalPickAllowMultiple : function( event, theFilePickerObject, replaceLocalFileInput )
    {
      var row = this.pickerList.addRow( theFilePickerObject, FILE_PICKER_ATTACH_TYPE_LOCAL );
      if ( row === null )
      {
        return;
      }

      if ( this.allowMultipleLocalFileUpload )
      {
        var attachmentTypeCell = $j(row).find( "input[name='" + this.baseElementName + "_attachmentType']" );
        var uniqueId = this.generateUniqueId();
        row.dataset.bbLocalFileId = uniqueId;
        this.localFileLookup[ uniqueId ] = theFilePickerObject.file;
      }

      // Wire a listener that will show the embed options when the embed action is chosen (if configured to)
      this.registerEmbedOptionsListener( widget.FilePicker.cellGenerators.fileActionEmbedOptions_index - 1 );
      if (replaceLocalFileInput === false )
      {
        return;
      }

      var cell = $( row.getElementsByTagName( 'td' )[ 0 ] );
      Element.remove( this.localFilePicker );
      this.localFilePicker.addClassName( "hiddenBbLocalFilePicker");
      this.localFilePicker.removeClassName( "hiddenInput" );
      this.localFilePicker.setStyle(
        {
          position : "absolute",
          top : '-10000px'
        } );
      this.localFilePicker.disabled = false;
      cell.appendChild( this.localFilePicker );

      // Set up the names of the local file fields
      this.pickerList.tableBody.getElementsBySelector( 'input[type="file"]' ).each( function( item, index )
      {
        item.name = this.baseElementName + '_LocalFile' + index;
      }.bind( this ) );

      this.insertNewLocalFilePickerInstance();

      if ( this.onAttachFile )
      {
        this.onAttachFile( this, true, row );
      }
    },

    /**
     * Creates a new local file picker
     */
    insertNewLocalFilePickerInstance : function()
    {
      // Create and insert a new local file picker for more local file attaching
      var newPicker = new Element( 'input',
      {
          class : 'hiddenInput',
          type : 'file',
          tabindex : '-1',
          multiple : this.allowMultipleLocalFileUpload ? true : false,
          id : this.baseElementName + '_chooseLocalFile'
      } );

      this.localFileContainer.insertBefore( newPicker, this.localFileContainer.firstChild );
      Event.observe( newPicker, "change", this.onLocalPick.bindAsEventListener( this ) );
      this.localFilePicker = newPicker;
    },

    generateUniqueId : function()
    {
      return '_' + Math.random().toString( 36 ).substr( 2, 9 );
    },

    /**
     * If a) Special Actions are enabled, and b) the embed options are configure to show up: - Wires up an on change
     * even on the special action select box that shows the embed options when the embed action is chosen.
     */
    registerEmbedOptionsListener : function( index )
    {
      if ( this.showSpecialAction )
      {
        var specialAction = $( this.baseElementName + '_specialAction' + index );
        var embedOptions = $( this.baseElementName + '_embedOptions' + index );
        if ( embedOptions )
        {
          specialAction.observe( 'change', function( event )
          {
            if ( "EMBED" == specialAction.options[ specialAction.selectedIndex ].value )
            {
              embedOptions.show();
            }
            else
            {
              embedOptions.hide();
            }
          } );
        }
      }
    },

    /**
     * Called after a url is chosen from the local file picker in multiple files mode - updating table
     */
    onURLPick : function( widget )
    {
      var selectedURL = document.getElementById( widget.baseElementName + '_newUrlName' );
      if (selectedURL.value.blank()) // TODO: More exhaustive URL validation?
      {
        alert(page.bundle.getString('filePicker.validate.invalid.url'));
        return false;
      }

      if ( widget.listHtmlDiv )
      {
        widget.listHtmlDiv.show();
      }


      if ( widget.allowMultipleFiles )
      {
        var urlFile =
        {
            fileName : selectedURL.value,
            fullUrlToFile : selectedURL.value,
            linkTitle : selectedURL.value
        };
        widget.onCSPickAllowMultiple( [ urlFile ] );
      }
      else
      {
        widget.selectedFileSource.value = FILE_PICKER_ATTACH_TYPE_CONTENT_SYSTEM;
        widget.selectedFileName.innerHTML = selectedURL.value;
        if ( widget.selectedFileLinkTitle )
        {
          widget.selectedFileLinkTitle.value = selectedURL.value;
        }
        widget.selectedFileActionsArea.show();
        widget.togglePickerButtons( false );
        if ( widget.pickMDButton )
        {
          widget.pickMDButton.hide();
        }
        if ( widget.onAttachFile )
        {
          widget.onAttachFile( widget, false );
        }
      }

      // Purge entry
      widget.flyout.close();
      selectedURL.value = '';
      return true;
    },

    /**
     * Called when the "Do not attach file" button is clicked
     */
    onCancelClick : function( event )
    {
      this.selectedFileActionsArea.hide();
      if( this.selectedFileHTMLWarningArea )
      {
        this.selectedFileHTMLWarningArea.hide();
      }
      this.clearSelectedFileInfo();
      this.togglePickerButtons( true );
      if ( event )
      {
        Event.stop( event );
      }
    },

    /**
     * Toggles the enabled state of the Local/CS picker buttons to the specified state
     */
    togglePickerButtons : function( enabled )
    {
      if ( this.allowLocal )
      {
        this.pickLocalButton.disabled = !enabled;
        if ( enabled )
        {
          this.pickLocalButton.className = 'browse visibleInput';
          this.localFilePicker.position = 'relative';
          this.localFilePicker.style.top = '';
        }
        else
        {
          this.pickLocalButton.className = 'disabled';
          this.localFilePicker.position = 'absolute';
          this.localFilePicker.style.top = '-10000px';
        }
        if ( this.allowMultiple )
        {
          this.localFilePicker.disabled = !enabled;
        }
      }
      if ( this.allowCS )
      {
        this.pickCSButton.disabled = !enabled;
        if ( enabled )
        {
          this.pickCSButton.className = 'browse visibleInput';
        }
        else
        {
          this.pickCSButton.className = 'disabled';
        }
      }
      if ( this.allowURL )
      {
        this.pickURLButton.disabled = !enabled;
        if ( enabled )
        {
          this.pickURLButton.className = 'browse visibleInput';
        }
        else
        {
          this.pickURLButton.className = 'disabled';
        }
      }
    },

    /**
     * Clears the info associated to the current attached file (if the user cancelled, or chose to attach another file )
     */
    clearSelectedFileInfo : function()
    {
      var isLocal = this.selectedFileSource.value == FILE_PICKER_ATTACH_TYPE_LOCAL;
      this.selectedFileName.innerHTML = "";
      this.selectedFileSource.value = "";
      if ( this.selectedFileLinkTitle )
      {
        this.selectedFileLinkTitle.value = "";
      }
      if ( this.pickMDButton )
      {
        $( this.baseElementName + '_CSTargetmetadata' ).value = "";
        $( this.baseElementName + '_CSTargetselection' ).value = "";
        $( this.baseElementName + '_CSTargetSynchronised' ).value = "";
        $( this.baseElementName + '_CSTargetDisplayFormat' ).value = "";
      }
      if ( $( this.baseElementName + "_permissionOptionsIndex" ) )
      {
        $( this.baseElementName + '_permissionOptionsIndex' ).value = -1;
        $( this.baseElementName + '_permissions0_all' ).checked = true;
      }
      if ( this.selectedFileSpecialAction )
      {
        this.selectedFileSpecialAction.selectedIndex = 0;
      }
      if ( isLocal )
      {
        var title = "";
        if ( !this.allowMultipleFiles )
        {
          title = this.localFilePicker.title;
          Element.remove( this.localFilePicker );
        }
        this.localFilePicker = $( document.createElement( "input" ) );
        if ( !this.allowMultipleFiles )
        {
          this.localFilePicker.name = this.baseElementName + '_LocalFile0';
          this.localFilePicker.tabIndex='-1';
          this.localFilePicker.id=this.baseElementName + '_chooseLocalFile';
        }
        this.localFilePicker.title = title;
        this.localFilePicker.type = "file";
        this.localFilePicker.addClassName( "hiddenInput" );
        this.localFileContainer.insertBefore( this.localFilePicker, this.localFileContainer.firstChild );
        Event.observe( this.localFilePicker, "change", this.onLocalPick.bindAsEventListener( this ) );
      }
      else
      {
        this.selectedCSFile.value = "";
        this.selectedCSFileName.value = "";
        if ( this.selectedFilePath )
        {
          this.selectedFilePath = "";
        }
        this.selectedCSFileSize.value = "";
        if ( this.showAddMetadata )
        {
          this.selectedCSFileMetadata.value = "";
          this.selectedCSFileMetadataSync.value = "";
          this.selectedCSFileMetadataFormat.value = "";
        }
      }
    },

    /**
     * Gets the file name based on the full file path.
     */
    getFileName : function( fullPath )
    {
      var result = fullPath;
      var lastIndexOfBackslash = fullPath.lastIndexOf( '\\' );
      var lastIndexOfSlash = fullPath.lastIndexOf( '/' );
      if ( lastIndexOfBackslash > lastIndexOfSlash )
      {
        result = fullPath.substring( lastIndexOfBackslash + 1, fullPath.length );
      }
      else if ( lastIndexOfSlash > lastIndexOfBackslash )
      {
        result = fullPath.substring( lastIndexOfSlash + 1, fullPath.length );
      }
      return result;
    },

    isFileNameValid : function( fileName )
    {
      //KEEP IN SYNC WITH FileSystemUtil.isValidEntryName
      if (!fileName || /[\/\\:?*"<>|]/.test( fileName ) )
      {
        return false;
      }
      return true;
    },

    setRequired : function( required )
    {
      this.required = required;
    },

    /**
     * Validates the form when it is submitted.
     */
    onSubmit : function( event )
    {
      // Validate the form if necessary
      if ( this.required )
      {
        if ( this.allowMultipleFiles )
        {
          if ( this.pickerList.tableBody.immediateDescendants().length === 0 )
          {
            alert( page.bundle.getString( "filePicker.validate.atLeastOne" ) );
            if ( event )
            {
              Event.stop( event );
            }
            return false;
          }
        }
        else
        {
          if ( ( this.selectedCSFile && this.selectedCSFile.value == '' ) && ( this.localFilePicker && this.localFilePicker.value == '' ) )
          {
            alert( page.bundle.getString( "filePicker.validate.one" ) );
            if ( event )
            {
              Event.stop( event );
            }
            return false;
          }
          else if ( this.localFilePicker && this.localFilePicker.value != '' )
          {
            var fileName = this.getFileName( this.localFilePicker.value );
            if( !this.isFileNameValid( fileName ) )
            {
              //KEEP IN SYNC WITH FileSystemUtil.isValidEntryName
              var invalidChars = "/ \\ : ? * \" < > |";
              var alertMsg = page.bundle.getString( "filePicker.validate.invalid.filename", fileName, invalidChars );
              alert( alertMsg );
              if ( event )
              {
                Event.stop( event );
              }
              return false;
            }
          }
        }
      }
      return true;
    }

};

// Creates hidden input items for selected files/folders if giving access to additional files/folder
// when attaching an HTML file
widget.FilePicker.permPickerCallback = function( baseElementName, permFileList, index, itemList )
{
  if ( itemList && itemList.length > 0 )
  {
    var i;
    var permFileListElem = $( permFileList );
    var hiddenInputs = "";

    if ( !permFileListElem )
    {
      return;
    }

    hiddenInputs += '<input type="hidden" name="' + baseElementName + '_permittedFiles' + index + '" value="' + itemList[ 0 ].fileName;
    for ( i = 1; i < itemList.length; i++ )
    {
      hiddenInputs += ':' + itemList[ i ].fileName;
    }
    hiddenInputs += '">';
    permFileListElem.innerHTML = hiddenInputs;
  }
};

/**
 * Toggles the "mark for removal" status of an item in the currently attached files table. Should be called from an
 * onclick attribute on the toggle link in the table.
 */
widget.FilePicker.toggleForRemove = function( event, removeLink )
{
  var e = event || window.event;
  removeLink = $( removeLink );
  var tableRow = removeLink.up( "tr" );
  var hiddenField = removeLink.up( "td" ).down( 'input[type="hidden"]' );

  tableRow.toggleClassName( "removeCell" );
  if ( hiddenField.disabled )
  {
    hiddenField.disabled = false;
    removeLink.innerHTML = page.bundle.getString( "filePicker.unmarkForRemove" );
  }
  else
  {
    hiddenField.disabled = true;
    removeLink.innerHTML = page.bundle.getString( "filePicker.markForRemove" );
  }
  Event.stop( e );
};

widget.FilePicker.togglePickerButton = function( pickerButton, enabled )
{
  if ( enabled )
  {
    $( pickerButton ).setAttribute( "href", "#" );
    $( pickerButton ).removeClassName( "disabled" );
  }
  else
  {
    $( pickerButton ).removeAttribute( "href" );
    $( pickerButton ).addClassName( "disabled" );
  }
};

widget.FilePicker.validateBrowser = function( showBbDialog, localBrowseButton ){
  if ( showBbDialog ) {
    UserDataDWRFacade.setStringTempScope(BROWSER_VALIDATION_SHOWN_ONCE_KEY, "false");
    bb_dialogs.bb_confirm({
      title: page.bundle.getString("filePicker.attachFiles.bbDialogTitle"),
      html: page.bundle.getString("filePicker.attachFiles.edgeBrowser"),
      buttons: [{
        text: page.bundle.getString("filePicker.attachFiles.bbDialogButton")
      }],
      onClose: function () {
        $(localBrowseButton).click();
      }
    });
  } else {
    $(localBrowseButton).click()
  }
};

widget.FilePicker.browserValidationBeforeFilePickingCallback = function( localBrowseButton ) {
  return function( status ) {
    var showBbDialog = status === "" || null == status;
    widget.FilePicker.validateBrowser( showBbDialog, localBrowseButton )
  };
};

widget.FilePicker.browserValidationBeforeFilePicking = function( localBrowseButton )
{
  var isEdge = Prototype.Browser.Edge;
  if( isEdge )
  {
    UserDataDWRFacade.getStringTempScope( BROWSER_VALIDATION_SHOWN_ONCE_KEY, widget.FilePicker.browserValidationBeforeFilePickingCallback( localBrowseButton ) );
  }
  else
  {
    $(localBrowseButton).click();
  }
};

/**
 * Removes the specified pending attachment. Should be called from an onclick handler on a link in the currently
 * attached files table
 */
widget.FilePicker.removePendingAttachment = function( event, removeLink, baseElementName )
{
  var e = event || window.event;
  if ( confirm( page.bundle.getString( "filePicker.doNotAttach.confirm" ) ) )
  {
    widget.FilePicker.removePendingAttachmentInternal( removeLink, baseElementName );
  }
  Event.stop( e );
};

/**
 * Removes the specified pending attachment without asking for confirmation.
 */
widget.FilePicker.removePendingAttachmentInternal = function( removeLink, baseElementName )
{
  removeLink = $( removeLink );
  var row = removeLink.up( "tr" );
  var tbody = row.up( "tbody" );

  // Remove the local file object from localFileLookup
  if ( row.dataset && row.dataset.bbLocalFileId )
  {
    var localFileId = row.dataset.bbLocalFileId;
    if ( localFileId )
    {
      delete window[ baseElementName + '_FilePickerObject' ].localFileLookup[ localFileId ];
    }
  }

  // Remove the pending row
  Element.remove( row );
  //if HTML warning is shown then hide it, if any local/cloud HTML files are being picked then show the warning.
  //Note: When showHTMLFileTypeWarning == false this implies that newFileHTMLWarning.style.display == none always
  var newFileHTMLWarning = document.getElementById(baseElementName + '_warning');
  if (newFileHTMLWarning.style.display != "none")
  {
    //hide warning
    newFileHTMLWarning.style.display = "none";
    let table = document.querySelector('#' + baseElementName+ '_table_body');
    for (let row of table.rows)
    {
      if( row.firstChild.firstChild && ( row.firstChild.firstChild.value == "L" || row.firstChild.firstChild.value == "CL" ))
      {
        let value = row.cells[0].innerText;
        if ( value.endsWith('.html') || value.endsWith('.htm') )
        {
          newFileHTMLWarning.style.display = "";
          break;
        }
      }
    }
  }
  // Re-index the local file inputs.
  tbody.getElementsBySelector( 'input[type="file"]' ).each( function( item, index )
  {
    item.name = baseElementName + '_LocalFile' + index;
  } );

  // Hide the whole attached files table if there are no more attached files.
  var rowTotal = tbody.getElementsByTagName( 'tr' ).length;
  if ( rowTotal === 0 )
  {
    var listHtmlDiv = $( baseElementName + "_listHtmlDiv" );
    if ( listHtmlDiv )
    {
      var msg = document.getElementById('sourceFile_successDIV');
      if(msg != null)
      {
        msg.parentNode.removeChild(msg);
      }

      listHtmlDiv.hide();
    }
  }
};

widget.FilePicker.getPermPickerUrl = function( csPickerUrl, path, pathElement )
{
  // reuse current file picker's url as fall back plan
  var baseUrl = csPickerUrl.split( "?" )[ 0 ];
  var queryParams = csPickerUrl.toQueryParams();
  queryParams.multi = 'true';
  if (queryParams.cmd == 'pickFile')
    queryParams.cmd = 'pickFileAndFolder';

  if (!path && pathElement)
  {
    path = pathElement.value;
  }
  queryParams.start_path=path;

  return baseUrl + "?" + $H( queryParams ).toQueryString();
};

widget.FilePicker.openPermPicker = function( event, csPickerUrl, pid, path, pathElement, callback )
{
  if ( !( pid && $( pid ) && $( pid ).type == 'radio' && $( pid ).checked ) )
  {
    return false;
  }

  var permPickerUrl = permPickerUrl = widget.FilePicker.getPermPickerUrl( csPickerUrl, path, pathElement );

  var windowId = "picker" + new Date().getTime();
  var myLightbox = new lightbox.Lightbox(
  {
      lightboxId : windowId,
      dimensions :
      {
          w : 1200,
          h : 675
      },
      title : page.bundle.getString( 'lightbox.title' ),
      ajax :
      {
          url : permPickerUrl,
          loadExternalScripts : true
      },
      closeOnBodyClick : false,
      msgs :
      {
        'close' : page.bundle.getString( 'lightbox.close' )
      }
  } );

  if ( callback )
  {
    myLightbox.resourcePickerCustomHandler = callback;
  }

  if ( !this.allowMultipleFiles )
  {
    // only used for single resource picking
    myLightbox.resourcePickerProperties =
    {};
    myLightbox.resourcePickerProperties.inputEntryURLToSet = this.selectedCSFile;
    myLightbox.resourcePickerProperties.inputFileSizeToSet = this.selectedCSFileSize;
    myLightbox.resourcePickerProperties.linkName = this.selectedCSFileName;
    if ( this.selectedCSFilePath )
    {
      myLightbox.resourcePickerProperties.filePath = this.selectedCSFilePath;
    }
  }
  myLightbox.open();
  Event.stop( event );
  return false;
};

/**
 * A registry of defined file pickers and methods to access this registry
 */
widget.FilePicker.filePickers =
{};
widget.FilePicker.registerFilePicker = function( filePicker )
{
  widget.FilePicker.filePickers[ filePicker.baseElementName ] = filePicker;
};
widget.FilePicker.unRegisterFilePicker = function( filePicker )
{
  delete widget.FilePicker.filePickers[ filePicker.baseElementName ];
};
widget.FilePicker.getFilePicker = function( baseElementName )
{
  return widget.FilePicker.filePickers[ baseElementName ];
};

/**
 * Cell generators for the current attached files table
 */
widget.FilePicker.cellGenerators =
{
    fileName : function( filePicker, attachType )
    {
      var result = '<input id="' + filePicker.baseElementName + '_rowid_' + filePicker.xythosId + '" type="hidden" name="' + filePicker.baseElementName + '_attachmentType" value="' + attachType + '">';
      result += '<input type="hidden" name="' + filePicker.baseElementName + '_fileId" value="new">';
      result += '<input type="hidden" name="' + filePicker.baseElementName + '_artifactFileId" value="' + filePicker.artifactFileId + '">';
      result += '<input type="hidden" name="' + filePicker.baseElementName + '_artifactType" value="' + filePicker.artifactType + '">';
      result += '<input type="hidden" name="' + filePicker.baseElementName + '_artifactTypeResourceKey" value="' + filePicker.artifactTypeResourceKey + '">';
      if ( attachType === FILE_PICKER_ATTACH_TYPE_LOCAL )
      {
        result += '<span class="fileName"><img src="' + getCdnURL("/images/ci/ng/cal_year_event.gif") + '" alt="' + page.bundle
          .getString('common.file') + '"> ' + $ESAPI.encoder().encodeForHTML(filePicker.getFileName(filePicker.localFilePicker.value)) + '</span>';
      }
      else if ( attachType === FILE_PICKER_ATTACH_TYPE_CLOUD  )
    	  {
    	    // attachType === 'CL' (Cloud)
    	    result += '<span class="fileName"><img src="' + getCdnURL( "/images/ci/ng/cal_year_event.gif" ) + '" alt="' + page.bundle
          .getString( 'common.file' ) + '"> ' + filePicker.linkTitle + '</span>';
    	    result += '<input type="hidden" name="' + filePicker.baseElementName + '_CloudFileTempLocation" value="' + filePicker.fileLocation + '">';
    	    result += '<input type="hidden" name="' + filePicker.baseElementName + '_CloudFileTempLocationFileNames" value="' + filePicker.linkTitle + '">';
    	    result += '<input type="hidden" name="' + filePicker.baseElementName + '_CloudFileTempLocationFileNamesWasFilesFiltered" value="' + filePicker.wasFileFiltered + '">';
    	  }
      else
      {
    	    // attachType === 'C' (Content System)
        result += '<span class="fileName"><img src="' + getCdnURL( "/images/ci/ng/cal_year_event.gif" ) + '" alt="' + page.bundle
            .getString( 'common.file' ) + '"> ' + filePicker.linkTitle + '</span>';
        result += '<input type="hidden" name="' + filePicker.baseElementName + '_CSFile" value="' + filePicker.fileName + '">';
        result += '<input type="hidden" name="' + filePicker.baseElementName + '_CSFileUrl" value="' + filePicker.fullUrlToFile + '">';
        if ( filePicker.showAddMetadata )
        {
          result += '<input type="hidden" name="' + filePicker.baseElementName + '_CSMetadata" id="' + filePicker.baseElementName + '_CSMetadata_' + filePicker.xythosId + '" value="">';
          result += '<input type="hidden" name="' + filePicker.baseElementName + '_CSMetadataSync" id="' + filePicker.baseElementName + '_CSMetadataSync_' + filePicker.xythosId + '" value="">';
          result += '<input type="hidden" name="' + filePicker.baseElementName + '_CSMetadataFormat" id="' + filePicker.baseElementName + '_CSMetadataFormat_' + filePicker.xythosId + '" value="">';
        }
      }
      return result;
    },
    fileType : function( filePicker, attachType )
    {
      var result = null;
      if ( attachType === FILE_PICKER_ATTACH_TYPE_LOCAL ||  attachType === FILE_PICKER_ATTACH_TYPE_CLOUD  )
      {
        result = page.bundle.getString( "filePicker.fileType.attachment" );
      }
      else
      {
        result = page.bundle.getString( "filePicker.fileType.content" );
      }
      return result;
    },
    linkTitle : function( filePicker, attachType )
    {
      var linkTitle = "";
      if ( attachType === FILE_PICKER_ATTACH_TYPE_LOCAL )
      {
        linkTitle = filePicker.getFileName( filePicker.localFilePicker.value );
      }
      else
      {
        if ( filePicker.linkTitle )
        {
          linkTitle = filePicker.linkTitle;
        }
      }
      // 'linkTitle' is used as an HTML attribute value and is enclosed by double quotes.
      // When the value contains double quotes it needs to be converted to its HTML entity representation to avoid
      // malformed HTML ( an example of malformed HTML is -> value="".docx" ).
      linkTitle = linkTitle.replace( /"/g, '&quot;' );
      return '<input type="text" name="' + filePicker.baseElementName + '_linkTitle" value="' + linkTitle +
             '" title="' + page.bundle.getString( "filePicker.nameOfLink" ) + " " + linkTitle + '"' +
             ' is-new-file="true">';
    },
    size : function( filePicker, attachType )
    {
      if (  attachType !== FILE_PICKER_ATTACH_TYPE_LOCAL && filePicker.size )
      {
        return '<input type="hidden" name="' + filePicker.baseElementName + '_size" value="' + filePicker.size + '"> ' + filePicker.size;
      }
      else
      {
        return "";
      }
    },
    fileAction : function( filePicker, attachType )
    {
      return widget.FilePicker.cellGenerators.fileActionEmbedOptions( filePicker, attachType, true );
    },
    fileActionEmbedOptions_index : 0, // used to uniquely identify embed options form elements on the page.
    fileActionEmbedOptions : function( filePicker, attachType, suppressOptions )
    {
      var index = widget.FilePicker.cellGenerators.fileActionEmbedOptions_index++;
      var baseName = filePicker.baseElementName;

      var isLocal = attachType === FILE_PICKER_ATTACH_TYPE_LOCAL;
      var fileName = isLocal ? filePicker.getFileName( filePicker.localFilePicker.value ) : filePicker.linkTitle;
      var ext = fileName.match( /.*\.(.*)/ );
      ext = ext ? ext[ 1 ] : '';

      // Determine the type of the attached file.
      var isType =
      {
          image : ( /gif|jpeg|png|tif|bmp|jpg/i ).test( ext ),
          videoQt : ( /qt|mov|moov|movie/i ).test( ext ),
          videoOther : ( /avi|mpg|mpeg|wmv|asf|wma|mpe/i ).test( ext ),
          real : ( /ra|ram|rm/i ).test( ext ),
          flash : ( /swa|swf/i ).test( ext ),
          audio : ( /aif|aiff|au|mp3|wav/i ).test( ext ),
          html : ( /html|htm/i ).test( ext )
      };

      var isMedia = isType.image || isType.videoQt || isType.videoOther || isType.flash || isType.audio;

      var result = '';
      if ( isMedia )
      {
        result += '<select id="' + baseName + '_specialAction' + index + '" name="' + baseName + '_specialAction"';
        result += ' title="' + page.bundle.getString( "filePicker.specialAction.for" ) + " " + fileName + '">';
        result += '<option value="LINK">' + page.bundle.getString( "filePicker.specialAction.link" ) + '</option>';
        result += '<option value="EMBED">' + page.bundle.getString( "filePicker.specialAction.embed" ) + '</option>';
        result += '</select>';

        // Render the embed options (if not suppressed)
        if ( !suppressOptions )
        {
          result += '<ul style="display: none;" class="nestedList smallControls liveArea liveArea-slim" id="' + baseName + '_embedOptions' + index + '">';

          // Alignment
          var fid = baseName + 'align' + index;
          result += '<li><div class="label">' + page.bundle.getString( 'wysiwyg.insert_picture.alignment' ) + '</div><div class="field" style="white-space:nowrap;">' + '<fieldset role="radiogroup"><legend><span class="hideoff">' + page.bundle
              .getString( 'wysiwyg.insert_picture.alignment' ) + '</span></legend>' + '<input type="radio" id="' + fid + '_l" name="' + fid + '" value="Left" checked> <label for="' + fid + '_l">' + page.bundle
              .getString( 'wysiwyg.insert_picture.alignment.left' ) + '</label>' + '<input type="radio" id="' + fid + '_c" name="' + fid + '" value="Center"> <label for="' + fid + '_c">' + page.bundle
              .getString( 'wysiwyg.insert_picture.alignment.center' ) + '</label>' + '<input type="radio" id="' + fid + '_r" name="' + fid + '" value="Right"> <label for="' + fid + '_r">' + page.bundle
              .getString( 'wysiwyg.insert_picture.alignment.right' ) + '</label></fieldset></div></li>';

          // Placement
          fid = baseName + 'placement' + index;
          result += '<li><div class="label">' + page.bundle.getString( 'wysiwyg.insert_picture.placement' ) + '</div><div class="field" style="white-space:nowrap;">' + '<fieldset role="radiogroup"><legend><span class="hideoff">' + page.bundle
              .getString( 'wysiwyg.insert_picture.placement' ) + '</span></legend>' + '<input type="radio" id="' + fid + '_a" name="' + fid + '" value="Above"> <label for="' + fid + '_a">' + page.bundle
              .getString( 'wysiwyg.insert_picture.placement.above' ) + '</label>' + '<input type="radio" id="' + fid + '_b" name="' + fid + '" value="Below" checked> <label for="' + fid + '_b">' + page.bundle
              .getString( 'wysiwyg.insert_picture.placement.below' ) + '</label></fieldset></div></li>';

          // Dimensions
          if ( !isType.audio )
          {
            fid = baseName + 'width' + index;
            result += '<li><div class="label"><label for="' + fid + '">' + page.bundle
                .getString( 'wysiwyg.insert_picture.width' ) + '</label></div><div class="field"><input class="width" type="text" name="' + fid + '" id="' + fid + '" size="4" value=""></div></li>';

            fid = baseName + 'height' + index;
            result += '<li><div class="label"><label for="' + fid + '">' + page.bundle
                .getString( 'wysiwyg.insert_picture.height' ) + '</label></div><div class="field"><input class="height" type="text" name="' + fid + '" id="' + fid + '" size="4" value=""></div></li>';
          }

          // Autoplay
          if ( !isType.image )
          {
            fid = baseName + 'autostart' + index;
            result += '<li><div class="label">' + page.bundle.getString( 'wysiwyg.insert_picture.autostart' ) + '</div><div class="field" style="white-space:nowrap;">' + '<fieldset role="radiogroup"><legend><span class="hideoff">' + page.bundle
                .getString( 'wysiwyg.insert_picture.autostart' ) + '</span></legend>' + '<input type="radio" id="' + fid + '_y" name="' + fid + '" value="true"> <label for="' + fid + '_y">' + page.bundle
                .getString( 'wysiwyg.insert_picture.yes' ) + '</label>' + '<input type="radio" id="' + fid + '_n" name="' + fid + '" value="false" checked> <label for="' + fid + '_n">' + page.bundle
                .getString( 'wysiwyg.insert_picture.no' ) + '</label></fieldset></div></li>';
          }

          // Loop
          if ( !isType.image && !isType.real )
          {
            fid = baseName + 'loop' + index;
            result += '<li><div class="label">' + page.bundle.getString( 'wysiwyg.insert_picture.loop' ) + '</div><div class="field" style="white-space:nowrap;">' + '<fieldset role="radiogroup"><legend><span class="hideoff">' + page.bundle
                .getString( 'wysiwyg.insert_picture.loop' ) + '</span></legend>' + '<input type="radio" id="' + fid + '_y" name="' + fid + '" value="true"> <label for="' + fid + '_y">' + page.bundle
                .getString( 'wysiwyg.insert_picture.yes' ) + '</label>' + '<input type="radio" id="' + baseName + 'loop' + index + '_n" name="' + fid + '" value="false" checked> <label for="' + fid + '_n">' + page.bundle
                .getString( 'wysiwyg.insert_picture.no' ) + '</label></fieldset></div></li>';
          }

          // Control (radio)
          if ( isType.videoQt || isType.real )
          {
            fid = baseName + 'controls' + index;
            result += '<li><div class="label">' + page.bundle.getString( 'wysiwyg.insert_picture.controls' ) + '</div><div class="field" style="white-space:nowrap;">' + '<fieldset role="radiogroup"><legend><span class="hideoff">' + page.bundle
                .getString( 'wysiwyg.insert_picture.controls' ) + '</span></legend>' + '<input type="radio" id="' + fid + '_y" name="' + fid + '" value="Full" checked> <label for="' + fid + '_y">' + page.bundle
                .getString( 'wysiwyg.insert_picture.yes' ) + '</label>' + '<input type="radio" id="' + fid + '_n" name="' + fid + '" value="None"> <label for="' + fid + '_n">' + page.bundle
                .getString( 'wysiwyg.insert_picture.no' ) + '</label></fieldset></div></li>';
          }

          // Controls (drop down)
          if ( isType.videoOther || isType.audio )
          {
            fid = baseName + 'controls' + index;
            result += '<li><div class="label"><label for="' + fid + '">' + page.bundle
                .getString( 'wysiwyg.insert_picture.controls' ) + '</label></div><div class="field"><select id="' + fid + '" name="' + fid + '" class="controls">' + '<option value="None">' + page.bundle
                .getString( 'wysiwyg.insert_picture.controls_none' ) + '</option>' + '<option value="Mini">' + page.bundle
                .getString( 'wysiwyg.insert_picture.controls_mini' ) + '</option>' + '<option value="Full" selected>' + page.bundle
                .getString( 'wysiwyg.insert_picture.controls_full' ) + '</option>' + '</select></div></li>';
          }

          // Quality
          if ( isType.flash )
          {
            fid = baseName + 'quality' + index;
            result += '<li><div class="label"><label for="' + fid + '">' + page.bundle
                .getString( 'wysiwyg.insert_picture.set_quality' ) + '</label></div><div class="field"><select id="' + fid + '" name="' + fid + '" class="quality">' + '<option value="Low">' + page.bundle
                .getString( 'wysiwyg.insert_picture.quality_low' ) + '</option>' + '<option value="Medium">' + page.bundle
                .getString( 'wysiwyg.insert_picture.quality_med' ) + '</option>' + '<option value="High">' + page.bundle
                .getString( 'wysiwyg.insert_picture.quality_high' ) + '</option>' + '<option value="Best" selected>' + page.bundle
                .getString( 'wysiwyg.insert_picture.quality_best' ) + '</option>' + '</select></div></li>';
          }

          if ( isType.image )
          {
            // URL
            fid = baseName + 'url' + index;
            result += '<li><div class="label"><label for="' + fid + '">' + page.bundle
                .getString( 'wysiwyg.insert_picture.url' ) + '</label></div><div class="field"><input type="text" name="' + fid + '" id="' + fid + '" size="25">' + '</div></li>';

            // New Window
            fid = baseName + 'newwin' + index;
            result += '<li><div class="label">' + page.bundle.getString( 'wysiwyg.insert_picture.new_window' ) + '</div><div class="field" style="white-space:nowrap;">' + '<fieldset role="radiogroup"><legend><span class="hideoff">' + page.bundle
                .getString( 'wysiwyg.insert_picture.new_window' ) + '</span></legend>' + '<input type="radio" id="' + fid + '_y" name="' + fid + '" value="true" checked> <label for="' + fid + '_y">' + page.bundle
                .getString( 'wysiwyg.insert_picture.yes' ) + '</label>' + '<input type="radio" id="' + fid + '_n" name="' + fid + '" value="false"> <label for="' + fid + '_n">' + page.bundle
                .getString( 'wysiwyg.insert_picture.no' ) + '</label>' + '</fieldset></div></li>';

            // Border
            fid = baseName + 'border' + index;
            result += '<li><div class="label"><label for="' + fid + '">' + page.bundle
                .getString( 'wysiwyg.insert_picture.border' ) + '</label></div><div class="field"><select id="' + fid + '" name="' + fid + '" class="border">' + '<option value="0" selected>' + page.bundle
                .getString( 'wysiwyg.insert_picture.none' ) + '</option>' + '<option value="1">1</option><option value="2">2</option><option value="3">3</option>' + '<option value="4">4</option></select></div></li>';
          }

          // Alt text
          fid = baseName + 'alttext' + index;
          result += '<li><div class="label"><label for="' + fid + '">' + page.bundle
              .getString( 'wysiwyg.insert_picture.alt_text' ) + '</label></div><div class="field"><input type="text" name="' + fid + '" id="' + fid + '" size="25" value=""></div><span class="fieldHelp clearfloats">' + page.bundle
              .getString( 'wysiwyg.insert_picture.alt_text.instructions' ) + '</span></li>';

          result += '</ul>';
        }
      }
      else
      {
        result += '<input type="hidden" name="' + filePicker.baseElementName + '_specialAction" value="LINK">';
        result += page.bundle.getString( "filePicker.specialAction.link" );
      }
      // The index is used to find the correct request parameters on the backend.
      result += '<input type="hidden" name="' + filePicker.baseElementName + '_specialActionIndex" value="' + ( isMedia && !suppressOptions ? index : -1 ) + '">';

      if ( filePicker.shouldManagePermission && !isLocal )
      {
        // permission management options
        var permissionCsPickerUrl = filePicker.csPickerUrl;
        if ( permissionCsPickerUrl.indexOf( 'multipicker=true' ) != -1 )
        {
          var xythosId = filePicker.fileName.sub( '/xid-', '' ).strip();
          if ( xythosId )
          {
            permissionCsPickerUrl = permissionCsPickerUrl + '&preselectedItemId=' + xythosId;
          }
        }

        result += '<ul id="' + filePicker.baseElementName + '_imgSpecOptions" class="nestedList smallControls liveArea liveArea-slim">';
        result += '<li>';
        var pid = baseName + "_permissions" + index;
        var pickerButtonId = baseName + "_permissionPickerButton" + index;
        var permFileListName = baseName + '_csPermFileList' + index;
        result += '<input type="radio" name="' + pid + '" value="A" id="' + pid + '_all" checked="checked" onChange="widget.FilePicker.togglePickerButton(\'' + pickerButtonId + '\', false)" />' + page.bundle
            .getString( "fm.permission.grant.all" ) + '<br/>';
        result += '<input type="radio" name="' + pid + '" value="O" id="' + pid + '_this" onChange="widget.FilePicker.togglePickerButton(\'' + pickerButtonId + '\', false)" />' + page.bundle
            .getString( "fm.permission.grant.this" ) + '<br/>';
        result += '<input type="radio" name="' + pid + '" value="S" id="' + pid + '_manual" onChange="widget.FilePicker.togglePickerButton(\'' + pickerButtonId + '\', true)" />' + page.bundle
            .getString( "fm.permission.grant.manual" );
        result += '<a id="' + pickerButtonId + '" class="button-4 disabled" style="margin:0 3px" onclick="widget.FilePicker.openPermPicker( event, \'' + permissionCsPickerUrl + '\', \'' + pid + '_manual\',\'' + filePicker.filePath + '\',\'' + filePicker.fileName + '\', widget.FilePicker.permPickerCallback.curry( \'' + baseName + '\', \'' + permFileListName + '\', ' + index + ' ) );">' + page.bundle
            .getString( "filePicker.browse" ) + '</a>';
        result += '</li>';
        result += '</ul>';
        result += '<div id="' + permFileListName + '" style="display: none;"></div>';
      }
      result += '<input type="hidden" name="' + baseName + '_permissionOptionsIndex" value="' + ( isType.html && !isLocal ? index : -1 ) + '">';

      return result;
    },
    remove : function( filePicker, attachType )
    {
      var result = '<a href="#" onclick="widget.FilePicker.removePendingAttachment(event, this, ';
      result += "'" + filePicker.baseElementName + "'";
      result += ');">' + page.bundle.getString( "filePicker.doNotAttach" ) + '</a>';

      return result;
    },

  // attach CS file alignment to course item
  align : function(filePicker, attachType) {
    var alignOptionsName = "csAlignedResources";
    var html = '<label  for="csAlignedResources" style="white-space:nowrap">'
        + '<input type="checkbox" id="'
        + alignOptionsName
        + '"'
        + ' name="'
        + alignOptionsName
        + '"'
        + ' value="'
        + filePicker.filePath
        + '"'
        + '/>'
        + ' '
        + page.bundle.getString('wysiwyg.insert_picture.csalign')
        + '</label>';
    return html;
  }
};

widget.InlineSingleCSFilePicker = Class.create();
widget.InlineSingleCSFilePicker.prototype =
{
    initialize : function( baseElementName, csPickerUrl, showAddMetadata, showSpecialAction )
    {
      this.baseElementName = baseElementName;
      this.csPickerUrl = csPickerUrl;
      this.showAddMetadata = showAddMetadata;
      this.showSpecialAction = showSpecialAction;
      this.browseButton = $( baseElementName + '_csBrowse' );
      this.fileEntry = $( baseElementName + '_CSFile' );
      this.fileId = $( baseElementName + '_fileId' );
      if ( this.showAddMetadata )
      {
        this.selectedCSFileMetadata = $( this.baseElementName + '_CSMetadata' );
        this.selectedCSFileMetadataSync = $( this.baseElementName + '_CSMetadataSync' );
        this.selectedCSFileMetadataFormat = $( this.baseElementName + '_CSFileMetadataFormat' );
      }

      Event.observe( this.browseButton, 'click', this.onCSBrowse.bindAsEventListener( this ) );
    },

    /**
     * Show the CS file chooser
     */
    onCSBrowse : function( event )
    {
      this.csBrowseWindow = null;
      var windowId = "picker" + new Date().getTime();
      var myLightbox = new lightbox.Lightbox(
      {
          lightboxId : windowId,
          dimensions :
          {
              w : 1200,
              h : 675
          },
          title : page.bundle.getString( 'lightbox.title' ),
          ajax :
          {
              url : this.csPickerUrl,
              loadExternalScripts : true
          },
          closeOnBodyClick : false,
          msgs :
          {
            'close' : page.bundle.getString( 'lightbox.close' )
          }
      } );

      if ( !this.allowMultipleFiles )
      {
        // only used for single resource picking
        myLightbox.resourcePickerProperties =
        {};
        myLightbox.resourcePickerProperties.inputEntryURLToSet = this.fileEntry;
        myLightbox.resourcePickerProperties.returnFullURL = false;
        myLightbox.resourcePickerProperties.linkName = this.fileId;
      }
      myLightbox.open();
      Event.stop( event );
      return false;
    },

    afterMD : function( metadata, synced, format )
    {
      var metadataString = metadata.join( "#" );
      this.selectedCSFileMetadata.value = metadataString;
      this.selectedCSFileMetadataSync.value = synced;
      this.selectedCSFileMetadataFormat.value = format;
    }
};

/**
 * Inline single local file picker - $baseElementName_attachmentType - 'AL' or 'L' or '' - $baseElementName_localBrowse
 * -
 * $baseElementName_fileId
 */
widget.InlineSingleLocalFilePicker = Class.create();
widget.InlineSingleLocalFilePicker.prototype =
{
    initialize : function( baseElementName, currentAttachedFile, required, showSpecialAction, showHTMLFileTypeWarning, enforceMaxFileUploadSize )
    {
      this.baseElementName = baseElementName;
      this.fileInput = $( baseElementName + '_chooseLocalFile' );
      this.pickLocalButton = $( baseElementName + '_localBrowse' );
      this.fileInputWrapper = $( this.fileInput.parentNode );
      this.attachmentType = $( baseElementName + '_attachmentType' );
      this.fullFileName = $( baseElementName + '_fileId' );
      this.attachmentNameSpan = $( baseElementName + '_attachmentName' );
      this.removeLink = $( baseElementName + '_removeLink' );
      this.inputArea = $( baseElementName + '_inputArea' );
      this.attachedFileArea = $( baseElementName + '_attachedFileArea' );
      this.required = required;
      this.showSpecialAction = showSpecialAction;
      // Whether enforcing max file upload size is enabled
      this.enforceMaxFileUploadSize = enforceMaxFileUploadSize;
      this.showHTMLFileTypeWarning = showHTMLFileTypeWarning;
      if( this.showHTMLFileTypeWarning )
      {
       this.selectedFileHTMLWarningArea = $( this.baseElementName + '_warning' );
      }
      // Wire up events
      Event.observe( this.fileInput, "change", this.onAfterChooseFile.bindAsEventListener( this ) );
      Event.observe( this.removeLink, "click", this.onRemoveClick.bindAsEventListener( this ) );
      var inlineSingleLocalFilePickerObj = this;
      doubleSubmit.registerFormSubmitEvents(this.fileInput.form, function(event){
        return inlineSingleLocalFilePickerObj.onSubmit(event);
      });

      // Set up initial values
      if ( currentAttachedFile )
      {
        this.setDefaultCurrentAttachedFile( currentAttachedFile );
        this.setTabIndexesHideAriaBrowseInput();
      }
      else
      {
        //hide the remove link element
        this.setTabIndexesHideAriaRemoveInput();
      }
      widget.InlineSingleLocalFilePicker.pickerMap[ baseElementName ] = this;
    },
    //set browse button to be un-tabble and not read by screen reader
    //if there is a file already shown (i.e. the remove button is showing)
    setTabIndexesHideAriaBrowseInput : function()
    {
      if( this.fileInput != null && this.pickLocalButton != null )
      {
        this.fileInput.setAttribute( "aria-hidden", true );
        this.fileInput.setAttribute( "tabindex", '-1' );
        this.fileInput.setAttribute( "style", 'display: none; visibility: hidden' );
        this.pickLocalButton.setAttribute( "aria-hidden", true );
        this.pickLocalButton.setAttribute( "tabindex", '-1' );
        this.pickLocalButton.setAttribute( "style", 'display: none; visibility: hidden' );
      }
    },
    //set remove button to be un-tabble and not read by screen reader
    setTabIndexesHideAriaRemoveInput : function()
    {
      if( this.removeLink != null )
      {
        this.removeLink.setAttribute( "aria-hidden", true );
        this.removeLink.setAttribute( "tabindex", -1 );
        this.removeLink.setAttribute( "style", 'display: none; visibility: hidden' );
      }
    },
    //set remove button to be tabbable and read by screen reader
    setTabIndexShowAriaRemoveInput : function()
    {
      if( this.removeLink != null ) {
        this.removeLink.setAttribute("aria-hidden", false);
        this.removeLink.removeAttribute("tabindex");
        this.removeLink.removeAttribute("style");
      }
    },
    setCurrentAttachedFile : function( file )
    {
      this.clearFileInput();
      if ( file )
      {
        this.attachmentType.value = 'AL';
        this.attachmentNameSpan.innerHTML = '<a href="' + file + '" target="_blank">' + this.getFileName( file ) + '</a>';
        if ( this.removeHiddenField )
        {
          Element.remove( this.removeHiddenField );
          this.removeHiddenField = null;
        }
        widget.ShowUnsavedChanges.changeHiddenValue( this.fullFileName, file );
        this.inputArea.setStyle(
        {
            position : "absolute",
            top : '-10000px'
        } );
        this.attachedFileArea.setStyle(
        {
            position : "static",
            top : ''
        } );
      }
      else
      {
        this.attachmentNameSpan.innerHTML = '';
        this.attachmentType.value = '';
        widget.ShowUnsavedChanges.changeHiddenValue( this.fullFileName, '' );
        this.inputArea.setStyle(
        {
            position : "static",
            top : ''
        } );
        this.attachedFileArea.setStyle(
        {
            position : "absolute",
            top : '-10000px'
        } );
      }
    },
    setDefaultCurrentAttachedFile : function( file )
    {
      this.clearFileInput();
      if ( file )
      {
        this.attachmentType.value = 'AL';
        this.attachmentType._defaultValue = 'AL';
        this.attachmentNameSpan.innerHTML = '<a href="' + file + '" target="_blank">' + this.getFileName( file ) + '</a>';
        if ( this.removeHiddenField )
        {
          Element.remove( this.removeHiddenField );
          this.removeHiddenField = null;
        }
        this.fullFileName.value = file;
        this.fullFileName._defaultValue = file;
        this.inputArea.setStyle(
        {
            position : "absolute",
            top : '-10000px'
        } );
        this.attachedFileArea.setStyle(
        {
            position : "static",
            top : ''
        } );
        this.setTabIndexShowAriaRemoveInput();
      }
      else
      {
        this.attachmentNameSpan.innerHTML = '';
        this.attachmentType.value = '';
        this.fullFileName.value = '';
        this.inputArea.setStyle(
        {
            position : "static",
            top : ''
        } );
        this.attachedFileArea.setStyle(
        {
            position : "absolute",
            top : '-10000px'
        } );
      }
    },
    onAfterChooseFile : function( event )
    {
      this.attachmentNameSpan.innerHTML = this.getFileName( this.fileInput.value, true );
      this.attachmentType.value = 'L';
      var pickedFile = this.fileInput.files[ 0 ];
      if ( this.enforceMaxFileUploadSize && ( pickedFile.size > fileUploadLimit.FILE_MAX_UPLOAD_SIZE ) )
      {
        parent.window.fileUploadLimit.showFileUploadLimitExceededDialog( [ pickedFile.name ] );
        // Remove picked file selection
        this.onRemoveClick( event );
        Event.stop( event );
        return;
      }
      if ( this.removeHiddenField )
      {
        Element.remove( this.removeHiddenField );
        this.removeHiddenField = null;
      }
      let fileName = this.fileInput.value;
      if ( fileName && this.showHTMLFileTypeWarning && ( fileName.endsWith('.html') || fileName.endsWith('.htm')) )
      {
       this.selectedFileHTMLWarningArea.show();
      }

      widget.ShowUnsavedChanges.changeHiddenValue( this.fullFileName, this.fileInput.value );
      this.inputArea.setStyle(
      {
          position : "absolute",
          top : '-10000px'
      } );
      this.attachedFileArea.setStyle(
      {
          position : "static",
          top : ''
      } );

      this.setTabIndexesHideAriaBrowseInput();

      //show the remove button
      this.setTabIndexShowAriaRemoveInput();
      Event.stop( event );
    },
    onRemoveClick : function( event )
    {
      this.clearFileInput();
      if( this.selectedFileHTMLWarningArea )
      {
       this.selectedFileHTMLWarningArea.hide();
      }
      if ( this.attachmentType.value == 'AL' )
      {
        this.removeHiddenField = document.createElement( 'input' );
        this.removeHiddenField.type = 'hidden';
        this.removeHiddenField.name = this.baseElementName + '_remove';
        this.removeHiddenField.id = this.baseElementName + '_remove';
        this.removeHiddenField.value = this.fullFileName.value;
        this.attachedFileArea.insertBefore( this.removeHiddenField, this.attachedFileArea.firstChild );
        widget.ShowUnsavedChanges.changeHiddenValue( this.fullFileName, this.fullFileName.value );
      }
      else
      {
        this.attachmentType.value = '';
        widget.ShowUnsavedChanges.changeHiddenValue( this.fullFileName, '' );
      }
      this.attachmentNameSpan.innerHTML = '';

      //hide the remove link element
      this.setTabIndexesHideAriaRemoveInput();

      //show the browse button (remove the display none / visibility hidden)
      this.fileInput.removeAttribute( "style" );
      this.pickLocalButton.removeAttribute( "style" );

      this.inputArea.setStyle(
      {
          position : "static",
          top : ''
      } );
      this.attachedFileArea.setStyle(
      {
          position : "absolute",
          top : '-10000px'
      } );
      Event.stop( event );
    },
    clearFileInput : function()
    {
      var title = this.fileInput.title;
      Element.remove( this.fileInput );
      this.fileInput = $( document.createElement( "input" ) );
      this.fileInput.title = title;
      this.fileInput.type = "file";
      this.fileInput.addClassName( "hiddenInput" );
      this.fileInput.name = this.baseElementName + '_LocalFile0';
      this.fileInput.id = this.baseElementName + '_chooseLocalFile';
      this.fileInput._defaultValue = '';
      this.fileInputWrapper.insertBefore( this.fileInput, this.fileInputWrapper.firstChild );
      Event.observe( this.fileInput, "change", this.onAfterChooseFile.bindAsEventListener( this ) );
    },
    /**
     * Gets the file name based on the full file path.
     *
     * @param fullPath Fully-qualified path of file
     * @param isDecodedName (optional) Indicates that the filename has already been URL decoded
     */
    getFileName : function( fullPath, isDecodedName )
    {
      var result = fullPath;
      var lastIndexOfBackslash = fullPath.lastIndexOf( '\\' );
      var lastIndexOfSlash = fullPath.lastIndexOf( '/' );
      if ( lastIndexOfBackslash > lastIndexOfSlash )
      {
        result = fullPath.substring( lastIndexOfBackslash + 1, fullPath.length );
      }
      else if ( lastIndexOfSlash > lastIndexOfBackslash )
      {
        result = fullPath.substring( lastIndexOfSlash + 1, fullPath.length );
      }
      return isDecodedName ? result : decodeURI( result );
    },
    /**
     * Validates the form when it is submitted.
     */
    onSubmit : function( event )
    {
      // Validate the form if necessary
      if ( event && this.required )
      {
        if ( this.fullFileName.value == '' )
        {
          alert( page.bundle.getString( "filePicker.validate.one" ) );
          if( event )
          {
            Event.stop( event );
          }
          return false;
        }
      }
      return true;
    }
};
widget.InlineSingleLocalFilePicker.pickerMap =
{};

/**
 * Read Only File picker
 */
widget.ReadOnlyFilePicker = Class.create();
widget.ReadOnlyFilePicker.prototype =
{
  /**
   * Creates a new file picker
   *
   * @param baseElementName the base name for the file picker elements
   */
  initialize : function( baseElementName )
  {
    this.baseElementName = baseElementName;
    this.listHtmlDiv = $( this.baseElementName + "_listHtmlDiv" );

    if ( this.listHtmlDiv )
    {
      this.listHtmlDiv.show();
    }
    widget.ReadOnlyFilePicker.pickerMap[ baseElementName ] = this;
  }
};
widget.ReadOnlyFilePicker.pickerMap =
{};

widget.UserRoleSelect = Class.create();
widget.UserRoleSelect.prototype =
{
    initialize : function( userSelectRoleDivStr, moveMsgJS, noRoleMsgJs )
    {
      this.sourceValueName = "_left_values";
      this.secondaryValueName = "_right_values";
      this.primaryValueName = "_primary_value";

      this.userSelectRoleDiv = $( userSelectRoleDivStr );
      if ( this.userSelectRoleDiv )
      {
        var selects = this.userSelectRoleDiv.getElementsByTagName( 'select' );
        var inputs = this.userSelectRoleDiv.getElementsByTagName( 'input' );
        var links = this.userSelectRoleDiv.getElementsByTagName( 'a' );
        this.source = $( selects[ 0 ] );
        this.primary = $( inputs[ 3 ] );
        this.secondary = $( selects[ 1 ] );

        this.leftValues = $( inputs[ 0 ] );
        this.rightValues = $( inputs[ 1 ] );
        this.primaryValue = $( inputs[ 2 ] );

        this.toPrimaryMove = $( links[ 0 ] );
        this.toSecondaryMove = $( links[ 1 ] );
        this.toSourceMove = $( links[ 2 ] );

        this.left_arrow = getCdnURL( "/images/ci/ng/cm_arrow_left.gif" );
        this.right_arrow = getCdnURL( "/images/ci/ng/cm_arrow_right.gif" );
        this.left_disabled_arrow = getCdnURL( "/images/ci/ng/cm_arrow_left_disabled.gif" );
        this.right_disabled_arrow = getCdnURL( "/images/ci/ng/cm_arrow_right_disabled.gif" );

        Event.observe( this.toSourceMove, "click", this.switchUserRoleColumns.bindAsEventListener( this, false,
                                                                                                   moveMsgJS,
                                                                                                   noRoleMsgJs ) );
        Event.observe( this.toPrimaryMove, "click", this.switchPrimary.bindAsEventListener( this, moveMsgJS ) );
        Event.observe( this.toSecondaryMove, "click", this.switchUserRoleColumns.bindAsEventListener( this, true,
                                                                                                      moveMsgJS,
                                                                                                      noRoleMsgJs ) );
        Event.observe( this.source, "change", this.focusSource.bindAsEventListener( this ) );
        Event.observe( this.secondary, "change", this.focusSecondary.bindAsEventListener( this ) );

        if(this.toPrimaryMove){
          this.toPrimaryMove.setAttribute("class", "disableArrows");
          this.getImage(this.toPrimaryMove).setAttribute("src", this.right_disabled_arrow);
        }
        if(this.toSecondaryMove){
          this.toSecondaryMove.setAttribute("class", "disableArrows");
          this.getImage(this.toSecondaryMove).setAttribute("src", this.right_disabled_arrow);
        }
        if(this.toSourceMove){
          this.toSourceMove.setAttribute("class", "disableArrows");
          this.getImage(this.toSourceMove).setAttribute("src", this.left_disabled_arrow);
        }
      }
    },

    getImage : function( moveElement )
    {
      return moveElement.childElements()[0];
    },

    focusSource : function( event )
    {
      if ( this.source.length <= 0 || this.source.selectedIndex == -1 ||
           this.source.selectedIndex > this.source.length - 1 )
      {
        this.toPrimaryMove.setAttribute( "class", "disableArrows" );
        this.toSecondaryMove.setAttribute( "class", "disableArrows" );
        this.getImage(this.toPrimaryMove).setAttribute("src", this.right_disabled_arrow);
        this.getImage(this.toSecondaryMove).setAttribute("src", this.right_disabled_arrow);
      }
      else
      {
        this.toPrimaryMove.removeAttribute( "class" );
        this.toSecondaryMove.removeAttribute( "class" );
        this.getImage(this.toPrimaryMove).setAttribute("src", this.right_arrow);
        this.getImage(this.toSecondaryMove).setAttribute("src", this.right_arrow);
      }
    },

    focusSecondary : function( event )
    {
      if ( this.secondary.length <= 0 || this.secondary.selectedIndex == -1 ||
           this.secondary.selectedIndex > this.secondary.length - 1 )
      {
        this.toSourceMove.setAttribute( "class", "disableArrows" );
        this.getImage(this.toSourceMove).setAttribute("src", this.left_disabled_arrow);
      }
      else
      {
        this.toSourceMove.removeAttribute( "class" );
        this.getImage(this.toSourceMove).setAttribute("src", this.left_arrow);
      }
    },

    switchPrimary : function( event, msg )
    {
      var indx;
      indx = 0;

      var sourceArray = this.source;
      if ( sourceArray.selectedIndex >= 0 )
      {
        indx = sourceArray.selectedIndex;
        var tmpOpt = this.getFromPrimary();

        this.primaryValue.value = sourceArray.options[ indx ].value;
        this.primary.value = sourceArray.options[ indx ].text;

        sourceArray.options[ indx ].selected = false;
        sourceArray.options[ indx ] = null;
        sourceArray.options[ sourceArray.length ] = tmpOpt;
      }
      this.writeToSelectBoxValues( this.source, this.leftValues );
      this.focusSource();

      return false;
    },
    getFromPrimary : function()
    {
      var primaryRoleField = this.primaryValue;
      var primaryField = this.primary;
      return new Option( primaryField.value, primaryRoleField.value );
    },
    writeToSelectBoxValues : function( selectBox, hiddenName )
    {
      var i = 0;
      var values = "";
      while ( i < selectBox.length )
      {
        if ( i > 0 )
        {
          values += ",";
        }
        values += selectBox.options[ i ].value;
        i++;
      }
      hiddenName.value = values;
      return true;
    },

    switchUserRoleColumns : function( event, isSourceDest, msg, noRoleMsg )
    {
      var indx;
      indx = 0;

      var sourceArray = this.source;
      var targetArray = this.secondary;

      if ( !isSourceDest ) // If we are moving from Dest to Source
      {
        var temp = sourceArray;
        sourceArray = targetArray;
        targetArray = temp;
      }

      var rightIndex = 0;
      var targetLength = targetArray.length;
      while ( sourceArray.selectedIndex >= 0 )
      {
        indx = sourceArray.selectedIndex;
        var tmpOpt = this.cloneMultipleRows( sourceArray.options[ indx ] );
        if ( targetLength > 0 )
        {
          var i = targetLength;

          while ( i > 0 )
          {
            var tmpOpt1 = this.cloneMultipleRows( targetArray.options[ i + rightIndex - 1 ] );
            if ( tmpOpt1.textContent.localeCompare( tmpOpt.textContent ) > 0 )
            {
              targetArray.options[ i + rightIndex ] = tmpOpt1;
            }
            else
            {
              targetArray.options[ i + rightIndex ] = tmpOpt;
              break;
            }
            i--;
          }
          if ( i == 0 )
          {
            targetArray.options[ i ] = tmpOpt;
          }
        }
        else
        {
          // targetLength == 0
          targetArray.options[ rightIndex ] = tmpOpt;
        }
        sourceArray.options[ indx ].selected = false;
        // targetArray.options[rigthIndex].selected=true;
        rightIndex = rightIndex + 1;
        sourceArray.options[ indx ] = null;
      } // end of while
      this.writeToSelectBoxValues( this.source, this.leftValues );
      this.writeToSelectBoxValues( this.secondary, this.rightValues );
      this.focusSource();
      this.focusSecondary();

      return false;
    },
    cloneMultipleRows : function( opt )
    {
      return new Option( opt.text, opt.value, opt.defaultSelected, opt.selected );
    }
};

widget.StepGroup =
{};
widget.StepGroup.toggleStepGroup = function( e, activeTabStr )
{
  var event = e || window.event;
  var target = Event.findElement( event, 'li' );
  var tabs = $A( $( 'dataCollectionContainer' ).getElementsByTagName( 'ul' )[ 0 ].getElementsByTagName( 'li' ) );
  tabs.each( function( tab )
  {
    tab = $( tab );

    if ( tab.id == target.id )
    {
      tab.addClassName( "active" );
      $( tab.getAttribute( "bb:groupId" ) ).show();
      $( 'activeTabSpanId_' + tab.id ).innerHTML = activeTabStr;
    }
    else
    {
      tab.removeClassName( "active" );
      $( tab.getAttribute( "bb:groupId" ) ).hide();
      $( 'activeTabSpanId_' + tab.id ).innerHTML = "";
    }
  } );
  Event.stop( event );
};
/**
 * Show a specific step group
 *
 * @param number - the number of the group in order of the tabs at the top (e.g. 1 is the leftmost tab, then 2, 3, etc.)
 */
widget.StepGroup.showStepGroup = function( number )
{
  var target = $( 'stepGroupTab_' + number );
  var tabs = $A( $( 'dataCollectionContainer' ).getElementsByTagName( 'ul' )[ 0 ].getElementsByTagName( 'li' ) );
  tabs.each( function( tab )
  {
    tab = $( tab );
    if ( tab.id == target.id )
    {
      tab.addClassName( "active" );
      $( tab.getAttribute( "bb:groupId" ) ).show();
    }
    else
    {
      tab.removeClassName( "active" );
      $( tab.getAttribute( "bb:groupId" ) ).hide();
    }
  } );
};
/**
 * Get the content block element to a specific step group
 *
 * @param number - the number of the group in order of the tabs at the top (e.g. 1 is the leftmost tab, then 2, 3, etc.)
 */
widget.StepGroup.getStepGroupContentBlock = function( number )
{
  var targetTab = $( 'stepGroupTab_' + number );
  return $( targetTab.getAttribute( "bb:groupId" ) );
};
widget.StepGroup.showAllStepGroupsForSubmit = function()
{
  var tabs = $A( $( 'dataCollectionContainer' ).getElementsByTagName( 'ul' )[ 0 ].getElementsByTagName( 'li' ) );
  tabs.each( function( tab )
  {
    $( tab.getAttribute( "bb:groupId" ) ).show();
  } );
};
widget.StepGroup.revertAllStepGroupsAfterSubmit = function()
{
  var tabs = $A( $( 'dataCollectionContainer' ).getElementsByTagName( 'ul' )[ 0 ].getElementsByTagName( 'li' ) );
  tabs.each( function( tab )
  {
    if ( page.util.hasClassName( tab, 'active' ) )
    {
      $( tab.getAttribute( "bb:groupId" ) ).show();
    }
    else
    {
      $( tab.getAttribute( "bb:groupId" ) ).hide();
    }
  } );
};
widget.ShowUnsavedChanges = Class.create();
widget.ShowUnsavedChanges.prototype =
{
  initialize : function( dataCollectionContainer, skipTextArea )
  {
    widget.ShowUnsavedChanges.enabled = true;
    widget.ShowUnsavedChanges.registerOnValueChangeCallback( widget.ShowUnsavedChanges.showIconsForUnsavedChanges );
    var container = $( dataCollectionContainer );
    var inputs = $A( container.getElementsByTagName( 'input' ) );
    var selects = $A( container.getElementsByTagName( 'select' ) );
    var textareas = $A( container.getElementsByTagName( 'textarea' ) );
    inputs.each( function( input )
    {
      input = $( input );
      var type = input.type.toLowerCase();
      if ( type == 'checkbox' || type == 'radio' )
      {
        input._defaultValue = input.checked;
      }
      else if ( type == 'hidden' || type == 'text' )
      {
        input._defaultValue = input.value;
      }
      else
      {
        input._defaultValue = '';
      }
      if ( type != 'hidden' && type != 'button' && type != 'submit' )
      {
        input.observe( 'change', widget.ShowUnsavedChanges.onValueChange.bindAsEventListener() );
      }
    }.bind( this ) );
    selects.each( function( input ) // TODO: multiselect?
    {
      input = $( input );
      input._defaultValue = input.selectedIndex;
      input.observe( 'change', widget.ShowUnsavedChanges.onValueChange.bindAsEventListener() );
    }.bind( this ) );

    if ( !skipTextArea || !skipTextArea )
    {
      textareas.each( function( input )
      {
        input = $( input );
        input._defaultValue = input.value;
        input.observe( 'change', widget.ShowUnsavedChanges.onValueChange.bindAsEventListener() );
      }.bind( this ) );
    }
  }
};

widget.ShowUnsavedChanges.onValueChangeCallback = function()
{
}; // do nothing
widget.ShowUnsavedChanges.registerOnValueChangeCallback = function( callbackFunction )
{
  widget.ShowUnsavedChanges.onValueChangeCallback = callbackFunction;
};

widget.ShowUnsavedChanges.dataElementsByStepGroup =
{};
widget.ShowUnsavedChanges.onValueChange = function( event, elem )
{
  if ( widget.ShowUnsavedChanges.enabled )
  {
    var dataElement = null;
    if ( event )
    {
      dataElement = Event.findElement( event, 'li' );
    }
    else
    {
      dataElement = elem.parentNode;
      while ( dataElement && dataElement.tagName.toLowerCase() != 'li' )
      {
        dataElement = dataElement.parentNode;
        if ( dataElement.tagName.toLowerCase() == 'body' )
        {
          dataElement = null;
        }
      }
      if ( dataElement )
      {
        dataElement = $( dataElement );
      }
    }
    if ( !dataElement )
    {
      return;
    }

    var isDefault = true;
    var inputs = $A( dataElement.getElementsByTagName( 'input' ) );
    var selects = $A( dataElement.getElementsByTagName( 'select' ) );
    var textareas = $A( dataElement.getElementsByTagName( 'textarea' ) );
    inputs.each( function( input )
    {
      var type = input.type.toLowerCase();
      if ( type == 'checkbox' || type == 'radio' )
      {
        isDefault &= ( input.checked == input._defaultValue );
      }
      else if ( type == 'hidden' || type == 'text' )
      {
        isDefault &= ( input.value == input._defaultValue );
      }
    } );
    selects.each( function( input ) // TODO: multiselect?
    {
      isDefault &= ( input.selectedIndex == input._defaultValue );
    } );
    textareas.each( function( input )
    {
      isDefault &= ( input.value == input._defaultValue );
    } );

    // trigger call back function
    widget.ShowUnsavedChanges.onValueChangeCallback( isDefault, dataElement );

  }
};

widget.ShowUnsavedChanges.showIconsForUnsavedChanges = function( isDefault, dataElement )
{
  var imgs = dataElement.getElementsByTagName( 'img' );
  var unsavedImg = null;
  for ( var i = 0; i < imgs.length; i++ )
  {
    if ( imgs[ i ].className.indexOf( 'unsavedChangeImg' ) >= 0 )
    {
      unsavedImg = $( imgs[ i ] );
      break;
    }
  }
  if ( unsavedImg )
  {
    if ( isDefault )
    {
      dataElement.removeClassName( 'dirty' );
      unsavedImg.hide();
    }
    else
    {
      dataElement.addClassName( 'dirty' );
      unsavedImg.show();
    }
    widget.ShowUnsavedChanges.updateStepGroupIndicator();
  }

};

widget.ShowUnsavedChanges.updateStepGroupIndicator = function()
{
  if ( widget.ShowUnsavedChanges.enabled )
  {
    // Loop through each step group tab, and determine if an icon that indicates
    // unsaved changes should be displayed in the tab itself
    $$( '#dataCollectionContainer ul li.stepGroupTab' ).each( function( tab )
    {
      var stepGroup = $( tab.getAttribute( "bb:groupId" ) );
      var img = $( tab.getElementsByTagName( 'img' )[ 0 ] );
      var link = $( tab.getElementsByTagName( 'a' )[ 0 ] );
      var dataElements = widget.ShowUnsavedChanges.dataElementsByStepGroup[ stepGroup.id ];
      if ( !dataElements )
      {
        dataElements = stepGroup.getElementsByTagName( 'li' );
        widget.ShowUnsavedChanges.dataElementsByStepGroup[ stepGroup.id ] = dataElements;
      }

      var dirtyCount = 0;
      for ( var i = 0; i < dataElements.length; i++ )
      {
        //If the data element is hidden, we do not want to include it in the count of dirty
        //data elements.  Doing so could result in the dirty image on the step group displaying
        //with no child data elements that display as dirty.
        if ( dataElements[ i ].hasClassName( "dirty" ) && dataElements[ i ].getStyle( "display" ) !== "none" )
        {
          dirtyCount++;
        }
      }
      if ( dirtyCount > 0 && !tab.isDirty )
      {
        img.show();
        link.setStyle(
        {
          'paddingLeft' : '20px'
        } );
        tab.isDirty = true;
      }
      else if ( dirtyCount === 0 && tab.isDirty )
      {
        img.hide();
        link.setStyle(
        {
          'paddingLeft' : ''
        } );
        tab.isDirty = false;
      }
    } );
  }
};
// Call this when the value of a hidden data element changes that you want to
// show an indicator for. Otherwise changing the value of the hidden element directly will
// not cause an indicator to show.
widget.ShowUnsavedChanges.changeHiddenValue = function( hiddenElem, value )
{
  hiddenElem.value = value;
  if ( widget.ShowUnsavedChanges.enabled )
  {
    widget.ShowUnsavedChanges.onValueChange( null, hiddenElem );
  }
};
widget.ShowUnsavedChanges.enabled = false;

/**
 * Supports a counter widget attached to a textbox -- it keeps track of the number of characters in the text box, and
 * updates a counter whenever that number changes. The counter turns red, and begins counting backwards, when the max
 * number of charters is exceeded.
 */
widget.TextBoxCounter = Class.create();
widget.TextBoxCounter.prototype =
{

    /**
     * Contructor
     *
     * @param textBoxId The id of the textbox we're counting from
     * @param counterId The id of the element that countains the count
     * @param maxCharCount The max number of characters supported by this textbox
     * @param charactersRemainingLabel The label for the character count element
     * @param charactersOverLimitLabel The alternate label for the character element, for when the max # of characters
     *          has been exceeded.
     */
    initialize : function( textBoxId, counterId, maxCharCount, charactersRemainingLabel, charactersOverLimitLabel )
    {

      this.textBoxElement = $( textBoxId );
      this.counterElement = $( counterId );
      this.maxCharCount = maxCharCount;
      this.countLabelElement = this.counterElement.up().childNodes[ 0 ];

      this.charactersRemainingLabel = charactersRemainingLabel;
      this.charactersOverLimitLabel = charactersOverLimitLabel;

      // watch all keystrokes in the text area, and update the counter accordingly
      this.textBoxElement.observe( 'keyup', this.updateCount.bindAsEventListener( this ) );

      // update the initial count
      this.updateCount();

      this.registerCounter( textBoxId );

    },

    /**
     * Registers the current counter with the document, so that it can be accessed from anywhere on the page.
     *
     * @param id The id with which this counter can be accessed
     */
    registerCounter : function( id )
    {
      if ( !widget.TextBoxCounter.counters )
      {
        widget.TextBoxCounter.counters = [];
      }
      widget.TextBoxCounter.counters[ id ] = this;
    },

    /**
     * Update the counter.
     *
     * @param event The event that prompted this update, if any.
     */
    updateCount : function( event )
    {

      var chars = this.textBoxElement.value.length;

      // max character count exceeded
      if ( chars > this.maxCharCount )
      {
        this.counterElement.update( chars - this.maxCharCount ).addClassName( 'bad' );
        this.countLabelElement.nodeValue = this.charactersOverLimitLabel;
      }

      // max character count not exceeded
      else if ( chars <= this.maxCharCount )
      {
        this.counterElement.update( this.maxCharCount - chars ).removeClassName( 'bad' );
        this.countLabelElement.nodeValue = this.charactersRemainingLabel;
      }

    }
};

widget.ColorPalettePicker = Class.create();
widget.ColorPalettePicker.prototype =
{
    initialize : function( onChange, themeChangeElementId )
    {
      widget.ColorPalettePicker.picker = this;

      this.onChange = onChange;
      var palettes = [];
      $A( $( 'paletteLibraryPanel' ).getElementsByTagName( 'li' ) ).each( function( li )
      {
        if ( page.util.hasClassName( li, 'palette' ) )
        {
          palettes.push( $( li ) );
        }
      } );
      this.palettes = palettes;
      this.libraryOpen = false;

      this.paletteLibraryPanel = $( 'paletteLibraryPanel' );
      this.paletteLibraryButton = $( 'paletteLibraryButton' );

      var updateHandler = this.updateCurrentSelection.bindAsEventListener( this );
      // this.paletteLibraryPanel.toggleLibrary();
      if ( this.palettes )
      {
        this.palettes.each( function( palette )
        {
          Event.observe( palette, "click", updateHandler );
        } );
      }
      if ( this.paletteLibraryButton )
      {
        Event.observe( 'paletteLibraryButtonLink', "click", this.toggleLibrary.bindAsEventListener( this ) );
      }
      if ( themeChangeElementId !== "" )
      {
        Event.observe( themeChangeElementId, "change", this.changePaletteThemeTypeStyles.bindAsEventListener( this ) );
      }
    },

    changePaletteThemeTypeStyles : function( event )
    {
      // IE does not support currentTarget for events,
      // so use the srcElement instead.
      var dropdown = event.currentTarget;
      if( !dropdown )
      {
        dropdown = event.srcElement;
      }

      var themeExtRef = $F( dropdown );
      var extRefToThemeTypeJson = $F( "themeExtRefToThemeTypeJson" );
      var extRefToThemeTypeMap = this.convertJsonToObject( decodeURIComponent( extRefToThemeTypeJson ) );

      var themeType = extRefToThemeTypeMap[themeExtRef];

      var mapKey = null;

      this.palettes.each( function( palette )
      {
        if( palette.id === "currentsystemthemecolorpalette" )
        {
          mapKey = "theme_type_" + themeExtRef;
        }
        else
        {
          if( themeType !== null )
          {
            mapKey = "theme_type_" + themeType;
          }
          else
          {
            mapKey = "theme_type_";
          }
        }
        var styleJson = $F( palette.down('input[type=hidden]') );
        var styleMap = this.convertJsonToObject( decodeURIComponent( styleJson ) );

        var schemePreviewStyle = styleMap[mapKey]['schemePreview'];
        var schemePreviewHeadStyle = styleMap[mapKey]['schemePreviewHead'];
        var schemePreviewBodyStyle = styleMap[mapKey]['schemePreviewBody'];
        var modulePreviewStyle = styleMap[mapKey]['moduleBorder'];
        var modulePreviewHeadStyle = styleMap[mapKey]['moduleTitle'];
        var modulePreviewBodyStyle = styleMap[mapKey]['moduleBody'];

        palette.down('.schemePreview').writeAttribute("style", schemePreviewStyle);
        palette.down('.schemePreviewHead').writeAttribute("style", schemePreviewHeadStyle);
        palette.down('.schemePreviewBody').writeAttribute("style", schemePreviewBodyStyle);
        palette.down('.modulePreview').writeAttribute("style", modulePreviewStyle);
        palette.down('.modulePreviewHead').writeAttribute("style", modulePreviewHeadStyle);
        palette.down('.modulePreviewBody').writeAttribute("style", modulePreviewBodyStyle);

      }, this );
    },

    convertJsonToObject : function( json )
    {
      if ( typeof ( JSON ) === 'object' && typeof ( JSON.parse ) === 'function' )
      {
        return  JSON.parse( json );
      }
      else
      {
        return eval( '(' + json + ')' );
      }
    },

    toggleLibrary : function( event )
    {
      var img = this.paletteLibraryButton.getElementsByTagName( 'img' )[ 0 ];
      if ( this.libraryOpen )
      {
        // Collapse the library.
        img.src = getCdnURL( "/images/db/p.gif" );
        img.alt = page.bundle.getString( "dynamictree.expand" );
        this.paletteLibraryPanel.hide();
        this.libraryOpen = false;
      }
      else
      {
        // Expand the library.
        img.src = getCdnURL( "/images/db/m.gif" );
        img.alt = page.bundle.getString( "dynamictree.collapse" );
        this.paletteLibraryPanel.show();
        this.libraryOpen = true;
      }

      // stop the event if exists; there will not be an event if called on page onLoad
      if ( event )
      {
        Event.stop( event );
      }
    },

    selectColorPaletteByExtRef : function( extRef )
    {
      var eventElement = $( extRef );
      this.selectColorPaletteByElement( eventElement );
    },

    selectColorPaletteByElement : function( eventElement )
    {
      this.palettes.each( function( p )
      {
        if ( p.hasClassName( "selected" ) )
        {
          p.removeClassName( 'selected' );
        }
      } );

      var selPal = eventElement;
      while ( selPal && selPal.tagName != 'LI' )
      {
        selPal = selPal.parentNode;
        if ( selPal.tagName == 'BODY' )
        {
          selPal = null;
        }
      }
      selPal.addClassName( 'selected' );
      widget.ShowUnsavedChanges.changeHiddenValue( $( 'currentPaletteExtRef' ),
                                                   selPal.id == 'currentsystemthemecolorpalette' ? '' : selPal.id );
      eval( this.onChange );
      $( 'currentPaletteLabel' ).update( $( selPal.id + '_label' ).innerHTML );
      this.copyStyles( selPal.down( '.schemePreview' ), $( 'currentPalettePreview' ) );
      this.copyStyles( selPal.down( '.schemePreviewHead' ), $( 'currentPalettePreviewHead' ) );
      this.copyStyles( selPal.down( '.schemePreviewBody' ), $( 'currentPalettePreviewBody' ) );
      this.copyStyles( selPal.down( '.modulePreview' ), $( 'currentModulePalettePreview' ) );
      this.copyStyles( selPal.down( '.modulePreviewHead' ), $( 'currentModulePalettePreviewHead' ) );
      this.copyStyles( selPal.down( '.modulePreviewBody' ), $( 'currentModulePalettePreviewBody' ) );
      $( 'selectedPalette' ).show();

    },
    updateCurrentSelection : function( event )
    {
      var eventElement = Event.element( event );
      this.selectColorPaletteByElement( eventElement );
      Event.stop( event );
    },

    copyStyles : function( s, d )
    {
      d.style.cssText = s.style.cssText;
    }

};
widget.ColorPalettePicker.picker = null;

/**
 * node picker
 */
widget.MINodePicker = Class.create();

/** Constants used for the picker */
widget.MINodePicker.Constants =
{
    EXISTING_NODE_SUFFIX : "",
    EXISTING_NODE_DELETE_SUFFIX : "",
    NEW_NODE_SUFFIX : ""
};

widget.MINodePicker.prototype =
{
    initConstants : function()
    {
      widget.MINodePicker.Constants.EXISTING_NODE_SUFFIX = page.bundle
          .getString( "nodePicker.const.existingNodeSuffix" );
      widget.MINodePicker.Constants.EXISTING_NODE_DELETE_SUFFIX = page.bundle
          .getString( "nodePicker.const.existingNodeDeleteSuffix" );
      widget.MINodePicker.Constants.NEW_NODE_SUFFIX = page.bundle.getString( "nodePicker.const.newNodeSuffix" );
    },

    /**
     * Creates a new node picker
     *
     * @param baseElementName the base name for the node picker elements
     * @param pickerList the javascript object representing the picker list (of currently attached files)
     * @param allowMultipleSelect boolean indicating whether the picker should allow single or multiple select
     * @param entitlements comma delimited list of entitlement UIDs in which to check on node search
     * @param popupInstructions key value pair of bundle name and bundle key for instructions to be displayed in the
     *   pop
     *          up
     * @param addPrimaryEntitlement Entitlement required to display primary radio button.
     * @param removeNodeEntitlement Entitlement required to display remove node link.
     * @param javascriptName The Javascript callback function defined by the opener. Function takes an array of objects
     *   as parameter.
     * @param alias Nodes are sometimes called Location or BusinessUnit. Caller can specify what terminology the picker
     *   should use. This value is fully supported only for button-only pickers i.e. when javascriptName is set.
     */
    initialize : function( baseElementName, pickerList, allowMultipleSelect, entitlements, popupInstructions, addPrimaryEntitlement, removeNodeEntitlement, javascriptName, alias )
    {
      this.initConstants();

      this.baseElementName = baseElementName;
      this.allowMultipleSelect = allowMultipleSelect;
      this.entitlements = entitlements;
      this.javascriptName = javascriptName;
      this.alias = alias;

      this.nodePickerPopupButton = $( this.baseElementName + '_nodeBrowseButton' );

      this.nodePickerUrl = "/webapps/blackboard/execute/institutionalHierarchy/nodePicker?cmd=openPicker&allowMultipleSelect=" + this.allowMultipleSelect + "&instructionKey=" + popupInstructions + "&entitlements=" + this.entitlements + "&addPrimaryEntitlement=" + addPrimaryEntitlement + "&removeNodeEntitlement=" + removeNodeEntitlement;
      if ( this.javascriptName )
      {
        this.nodePickerUrl +=  "&callback=" + this.javascriptName;
      }
      if ( this.alias && this.alias !== 'Node' )
      {
        this.nodePickerUrl += '&alias=' + this.alias;
      }

      Event.observe( this.nodePickerPopupButton, "click", this.onNodeBrowse.bindAsEventListener( this ) );

      this.pickerList = pickerList;
      this.selectedNodesListContainer = $( this.baseElementName + '_listHtml' );

      // make sure that all removedNodes are hidden
      if ( this.selectedNodesListContainer )
      {
        var removedNodes = this.selectedNodesListContainer
            .getElementsBySelector( 'input[name=' + this.baseElementName + widget.MINodePicker.Constants.EXISTING_NODE_DELETE_SUFFIX + ']' );
        removedNodes.each( function( node )
        {
          node.up( 'tr' ).hide();
        } );
      }

      var showList;

      // For multiple node picker, DOM contains a table structure for displaying the attached nodes
      if ( this.allowMultipleSelect )
      {
        showList = this.selectedNodesListContainer && this.pickerList && this.pickerList.tableBody && !this.pickerList.tableBody
            .empty();
      }
      // For single node picker, the attached node is contained within a span element
      else
      {
        showList = this.selectedNodesListContainer && this.selectedNodesListContainer.select( "input.selectedNodeData" ) && this.pickerList;
      }

      if ( this.pickerList && this.pickerList.tableBody )
      {
        // If no visible row then hide the table label and headers.
        if ( !this.pickerList.tableBody.select( "tr" ).any( function( row )
        {
          return row.visible();
        } ) )
        {
          showList = false;
        }
      }

      this.showHideSelectedNodesList( showList );

      widget.MINodePicker.registerNodePicker( this );
    },

    /**
     * Pop up the node search window from which to pick nodes
     */
    onNodeBrowse : function( event )
    {
      this.nodePickerWindow = null;
      var windowId = new Date().getTime();
      if ( $( 'primaryNodeIdStr' ) )
      {
        this.nodePickerUrl += '&primaryNodeIdStr=' + $F( 'primaryNodeIdStr' );
      }
      if ( $( 'objectType' ) )
      {
        this.nodePickerUrl += '&objectType=' + $F( 'objectType' );
      }
      this.nodePickerWindow = popup.launchPicker( this.nodePickerUrl, windowId, 1000, 700 );
      if ( this.nodePickerWindow )
      {
        this.nodePickerWindow.opener.customHandler = this.onNodePick.bind( this );
      }
      Event.stop( event );
    },

    /**
     * Callback called after node(s) have been selected from the node picker pop up. This method updates the UI list of
     * currently select nodes.
     *
     * @param selectedNodesObjArr The array of currently selected nodes from the picker
     */
    onNodePick : function( selectedNodesObjArr )
    {
      this.showHideSelectedNodesList( true );
      var existingNodes;

      if ( this.allowMultipleSelect )
      {
        // Array of existing selected nodes in the node picker list
        existingNodes = this.selectedNodesListContainer.down( "tbody" ).select( "input.selectedNodeData" );
      }
      else
      {
        // Existing selected node in the node picker list for single node picker
        existingNodes = this.selectedNodesListContainer.select( "input.selectedNodeData" );
      }

      // TODO: This block of code is specific to data integration page and should be taken out where it actually
      // belongs.
      // Perhaps, defining an event in the picker and have data integration page register for that event and have this
      // logic implemented would be the right thing to do.
      if ( selectedNodesObjArr && selectedNodesObjArr.length !== 0 )
      {
        // Switch the radio button selection to Create hierarchy under the specified entity (for single node pickers)
        if ( $( "selectedRoot" ) )
        {
          $( "selectedRoot" ).checked = true;
        }
      }

      /*
       * For each selected node, add the node to the list if it is a newly selected node, otherwise unhide the node if
       * it is an existing selection that has been marked for delete. Specifically: - If node is an existing selected
       * node and marked for delete and hidden, then unmark and show - If node is an existing selected node and not
       * marked for delete and showing, then do nothing - If node is a newly selected node and is not already there, add
       * the row - If node is a newly selected node and is already there, then do nothing
       */
      selectedNodesObjArr.each( function( node )
      {
        // See if the picked node is already in the list of nodes
        var existingNode;
        existingNodes.each( function( inputEle )
        {
          if ( node.nodeIdStr === inputEle.value )
          {
            existingNode = inputEle;
            if ( existingNode.disabled && existingNode.checked )
            {
              // If its a disabled primary node then restore the value of it in hidden param.
              $( this.baseElementName + '_disabledPrimaryNode' ).value = node.nodeIdStr;
            }
            throw $break;
          }
        } );

        // If not, then add this newly picked node to list
        if ( !existingNode )
        {
          var primaryRadioChecked;
          var existingPrimaryNodeRadios = this.selectedNodesListContainer
              .select( 'input[name=' + this.baseElementName + '_PrimaryNode]' );
          if ( existingPrimaryNodeRadios.all( function( radio )
          {
            return !radio.checked;
          } ) )
          {
            primaryRadioChecked = true;
          }
          // For multiple node picker, DOM contains a table structure for displaying the attached nodes
          if ( this.allowMultipleSelect )
          {
            // This calls the cell generator methods for each column in the "currently selected nodes" list
            this.pickerList.addRow( this.baseElementName, node, this.nodePickerWindow, primaryRadioChecked );
          }
          // For single node picker, the attached node is contained within a span element
          else
          {
            this.selectedNodesListContainer.innerHTML = "";
            this.pickerList.cellGenerators.each( function( generator, index )
            {
              var args = [];
              args.push( this.baseElementName, node, this.nodePickerWindow );
              this.selectedNodesListContainer.innerHTML += generator.apply( window, args );
            }.bind( this ) );
          }
        }
        else
        {
          /*
           * If picked node is already in the list AND is an existing selected node that is marked for delete and
           * hidden, then unmark node and show in list.
           */
          if ( existingNode.name.endsWith( widget.MINodePicker.Constants.EXISTING_NODE_DELETE_SUFFIX ) )
          {
            existingNode.name = existingNode.name.sub( widget.MINodePicker.Constants.EXISTING_NODE_DELETE_SUFFIX,
                                                       widget.MINodePicker.Constants.EXISTING_NODE_SUFFIX );
            if ( this.allowMultipleSelect )
            {
              existingNode.up( "tr" ).show();
            }
          }
        }
      }.bind( this ) );
    },

    /**
     * Shows or hides the selected nodes list
     *
     * @param show boolean to indicate show or hide
     */
    showHideSelectedNodesList : function( show )
    {
      if ( this.selectedNodesListContainer )
      {
        return show ? this.selectedNodesListContainer.show() : this.selectedNodesListContainer.hide();
      }
    }
};

/**
 * Removes the specified node selection from the list. Should be called from an onclick handler on a link in the
 * currently selected nodes table.
 */
widget.MINodePicker.removeSelectedNode = function( event, removeLink, baseElementName )
{
  var e = event || window.event;

  // Have user confirm removal of selected node
  if ( confirm( page.bundle.getString( "nodePicker.nodeRemoveConfirmMsg" ) ) )
  {
    var visibleRows = [];
    var picker = widget.MINodePicker.getNodePicker( baseElementName );
    var hiddenNodeDataEle;
    // For multiple node picker, DOM contains a table structure for displaying the attached nodes
    if ( picker.allowMultipleSelect )
    {
      // Get references to DOM elements in the list
      removeLink = $( removeLink );
      var rowToHideRemove = removeLink.up( "tr" );
      var tbodyEle = rowToHideRemove.up( "tbody" );
      hiddenNodeDataEle = rowToHideRemove.down( "input.selectedNodeData" );

      var primaryNodeRadioSelector = 'input[name=' + baseElementName + '_PrimaryNode]';
      var primaryNodeRadioInCurrentRow = rowToHideRemove.down( primaryNodeRadioSelector );
      if ( primaryNodeRadioInCurrentRow )
      {
        // Check if removed node is selected as a primary node
        if ( primaryNodeRadioInCurrentRow.checked )
        {
          if ( primaryNodeRadioInCurrentRow.disabled )
          {
            // A disabled primary node is removed from UI then nullify the value of hidden param storing its value.
            $( baseElementName + '_disabledPrimaryNode' ).value = '';
          }
          else
          {
            // Get the next node which is not checked as primary and is enabled.
            var nextNode = picker.selectedNodesListContainer.select( primaryNodeRadioSelector ).find( function( radio )
            {
              return ( !radio.checked && !radio.disabled && radio.up( 'tr' ).visible() );
            } );

            if ( nextNode )
            {
              nextNode.checked = true;
            }
            else
            {
              // In case there's no next node with primary node radio button, then uncheck current primary manually
              primaryNodeRadioInCurrentRow.checked = false;
            }
          }
        }
      }

      // Hide or remove the row

      // If this is an existing selected node
      if ( hiddenNodeDataEle.name.endsWith( widget.MINodePicker.Constants.EXISTING_NODE_SUFFIX ) )
      {
        // "mark" for deletion
        hiddenNodeDataEle.name = hiddenNodeDataEle.name.sub( widget.MINodePicker.Constants.EXISTING_NODE_SUFFIX,
                                                             widget.MINodePicker.Constants.EXISTING_NODE_DELETE_SUFFIX );
        // hide
        rowToHideRemove.hide();
      }
      // If is a newly selected node
      else if ( hiddenNodeDataEle.name.endsWith( widget.MINodePicker.Constants.NEW_NODE_SUFFIX ) )
      {
        // remove the row from the DOM
        Element.remove( rowToHideRemove );
      }

      tbodyEle.select( "tr" ).each( function( row )
      {
        if ( row.visible() )
        {
          visibleRows.push( row );
        }
      } );
    }
    // For single node picker, the attached node is contained within a span element
    else
    {
      hiddenNodeDataEle = picker.selectedNodesListContainer.down( "input.selectedNodeData" );

      // Hide or remove the row

      // If this is an existing selected node
      if ( hiddenNodeDataEle.name.endsWith( widget.MINodePicker.Constants.EXISTING_NODE_SUFFIX ) )
      {
        // "mark" for deletion
        hiddenNodeDataEle.name = hiddenNodeDataEle.name.sub( widget.MINodePicker.Constants.EXISTING_NODE_SUFFIX,
                                                             widget.MINodePicker.Constants.EXISTING_NODE_DELETE_SUFFIX );
      }
      // If is a newly selected node, clear the span content
      else if ( hiddenNodeDataEle.name.endsWith( widget.MINodePicker.Constants.NEW_NODE_SUFFIX ) )
      {
        picker.selectedNodesListContainer.innerHTML = "";
      }
    }

    // If there are no more selected nodes, hide some UI elements

    if ( visibleRows.length === 0 )
    {
      // Hide the whole selected nodes table
      picker.showHideSelectedNodesList( false );

      // TODO: This block of code is specific to data integration page and should be taken out where it actually
      // belongs.
      // Perhaps, defining an event in the picker and have data integration page register for that event and have this
      // logic implemented would be the right thing to do.
      // Switch the radio button selection to Create hierarchy under the top level (for single node pickers)
      if ( $( "topLevelRoot" ) )
      {
        $( "topLevelRoot" ).checked = true;
      }
    }
  }

  Event.stop( e );
};

/**
 * A registry of defined node pickers and methods to access this registry
 */
widget.MINodePicker.nodePickers =
{};

widget.MINodePicker.registerNodePicker = function( nodePicker )
{
  widget.MINodePicker.nodePickers[ nodePicker.baseElementName ] = nodePicker;
};
widget.MINodePicker.unRegisterNodePicker = function( nodePicker )
{
  delete widget.MINodePicker.nodePickers[ nodePicker.baseElementName ];
};
widget.MINodePicker.getNodePicker = function( baseElementName )
{
  return widget.MINodePicker.nodePickers[ baseElementName ];
};

/**
 * Cell generators for the currently selected nodes table. Mostly copies what is in multiInstNodePickerListElement.vm.
 */
widget.MINodePicker.cellGenerators =
{
    /**
     * Dynamic rendering of a cell in the node "Name" column
     */
    nodeName : function( pickerNameStr, selectedNodeObj, nodePickerWindow )
    {
      var result = '<input type="hidden" name="' + pickerNameStr + widget.MINodePicker.Constants.NEW_NODE_SUFFIX + '" value="' + selectedNodeObj.nodeIdStr + '" class="selectedNodeData">';
      result += '<img src="' + getCdnURL( "/images/ci/ng/entity_small.png" ) + '" alt="">';
      result += selectedNodeObj.nodeName;
      return result;
    },

    /**
     * Dynamic rendering of a cell in the node "Primary Node" column
     */
    nodePrimary : function( pickerNameStr, selectedNodeObj, nodePickerWindow, primaryRadioChecked )
    {

      var result = '<input type="radio" id="' + selectedNodeObj.nodeIdStr + '_Primary' + '" name="' + pickerNameStr + '_PrimaryNode" value="' + selectedNodeObj.nodeIdStr + '" class="selectedNodeData"';
      if ( nodePickerWindow.document.getElementById( selectedNodeObj.nodeIdStr + '_disableRadio' ).value == 'true' )
      {
        result += ' disabled';
      }
      if ( primaryRadioChecked )
      {
        result += ' checked';
      }
      result += ' >';

      // Since values of disabled radio element doesn't go through the request, adding hidden param here to store its
      // value.
      if ( nodePickerWindow.document.getElementById( selectedNodeObj.nodeIdStr + '_disableRadio' ).value == 'true' && primaryRadioChecked )
      {
        result += '<input type="hidden" id="' + pickerNameStr + '_disabledPrimaryNode" name="' + pickerNameStr + '_PrimaryNode" value="' + selectedNodeObj.nodeIdStr + '" />';
      }

      return result;
    },

    /**
     * Dynamic rendering of a cell in the remove node column
     */
    nodeRemove : function( pickerNameStr, selectedNodeObj, nodePickerWindow )
    {

      if ( nodePickerWindow.document.getElementById( selectedNodeObj.nodeIdStr + '_canRemoveObject' ).value == 'true' )
      {
        var result = '<img src="' + getCdnURL( "/images/ci/icons/x_ia.gif" ) + '" alt="">';
        result += '<a href="#" onclick="widget.MINodePicker.removeSelectedNode(event, this, ';
        result += "'" + pickerNameStr + "');";
        result += '">' + page.bundle.getString( "nodePicker.nodeRemoveLabel" );
        result += '</a>';
        return result;
      }
      else
      {
        return '';
      }
    }
};

widget.LockUnlockToggle = {};

widget.LockUnlockToggle.toggleAvail = function( element, id, onTitle, offTitle )
{
	id = unescape( id );
	var el = $(element);
	var checkbox = $( id );
	var toggleLink = $( 'toggle_link_' + id );
	var hiddenInput = $( 'hidden_' + id );
	var isOn = hiddenInput.value === 'true';
	if ( el.id === id ) {
	  // Checkbox change event happens after the state of the checkbox changes
	  // so we need to get the previous value (i.e. invert it)
	  isOn = !checkbox.checked;
	}
	if ( !isOn )
	{
	  checkbox.checked = true;
	  checkbox.value = "true";
	  checkbox.title=unescape(onTitle);
	  hiddenInput.value = "true";
	  toggleLink.removeClassName( 'course-availability-button course-available' );
	  toggleLink.addClassName( 'course-availability-button course-unavailable' );
	  toggleLink.title=unescape(onTitle);
	  toggleLink.setAttribute( "aria-label", unescape(onTitle) );
    toggleLink.setAttribute( "aria-checked", "true" );
    el.blur();
	}
	else
	{
	  checkbox.checked = false;
	  checkbox.value = "false";
	  checkbox.title=unescape(offTitle);
	  hiddenInput.value = "false";
	  toggleLink.removeClassName( 'course-availability-button course-unavailable' );
	  toggleLink.addClassName( 'course-availability-button course-available' );
	  toggleLink.title=unescape(offTitle);
	  toggleLink.setAttribute( "aria-label", unescape(offTitle) );
    toggleLink.setAttribute( "aria-checked", "false" );
    el.blur();
	}
	toggleLink.setAttribute( "aria-labelledby", id );
};

/**
 * This returns the boolean state of the toggle with the given id.
 * If the toggle with the given id does not exist, false is returned.
 *
 * @param id Id of the toggle to get the state from
 */
widget.LockUnlockToggle.getToggleState = function( id )
{
  var hiddenInput = $( 'hidden_' + id );
  return hiddenInput ? hiddenInput.value === 'true' : false;
};

widget.OnOffToggle = {};

/**
 * This toggles the on/off button visually and updates the hidden input.
 *
 * Also keeps the link and checkbox in sync.
 *
 * @param element the element that triggered the toggle (either the link or the checkbox)
 * @param id the id of the toggle
 */
widget.OnOffToggle.toggleAvail = function( element, id, onTitle, offTitle )
{
  id = unescape( id );
  var el = $(element);
  var checkbox = $( id );
  var toggleLink = $( 'toggle_link_' + id );
  var hiddenInput = $( 'hidden_' + id );
  var isOn = hiddenInput.value === 'true';
  if ( el.id === id ) {
    // Checkbox change event happens after the state of the checkbox changes
    // so we need to get the previous value (i.e. invert it)
    isOn = !checkbox.checked;
  }
  if ( !isOn )
  {
    checkbox.checked = true;
    checkbox.value = "true";
    checkbox.title=unescape(onTitle);
    hiddenInput.value = "true";
    toggleLink.removeClassName( 'read-off' );
    toggleLink.addClassName( 'read-on' );
    toggleLink.down().update( page.bundle.getString( 'action.on' ) );
    toggleLink.title=unescape(onTitle);
    toggleLink.setAttribute( "aria-label", unescape(onTitle) );
    toggleLink.setAttribute( "aria-checked", "true" );
  }
  else
  {
    checkbox.checked = false;
    checkbox.value = "false";
    checkbox.title=unescape(offTitle);
    hiddenInput.value = "false";
    toggleLink.removeClassName( 'read-on' );
    toggleLink.addClassName( 'read-off' );
    toggleLink.down().update( page.bundle.getString( 'action.off' ) );
    toggleLink.title=unescape(offTitle);
    toggleLink.setAttribute( "aria-label", unescape(offTitle) );
    toggleLink.setAttribute( "aria-checked", "false" );
  }
  toggleLink.setAttribute( "aria-labelledby", id );
};

/**
 * This returns the boolean state of the toggle with the given id.
 * If the toggle with the given id does not exist, false is returned.
 *
 * @param id Id of the toggle to get the state from
 */
widget.OnOffToggle.getToggleState = function( id )
{
  var hiddenInput = $( 'hidden_' + id );
  return hiddenInput ? hiddenInput.value === 'true' : false;
};
