var assessment =
{};
assessment.submitDrawerUrl = "";
assessment.questionVisibility = true;
assessment.blockToLeaveVisible = 'null';
assessment.savingRightNow = false; // Used to avoid auto-saving concurrently with User initiated saves
assessment.submittingRightNow = false; // set to true when we're submitting the assessment as a whole - used to block
                                        // other submits
assessment.userReallyWantsToSubmit = false;
assessment.isInUse = false;
assessment.safetyNetDelay = 60; // Number of seconds to wait before telling the user that it is taking too long.
assessment.alreadySavedSafetyNetId = null;
assessment.saveSequence = 0;
assessment.takePageId = 0; // Set from the server based on time when page is loaded
assessment.isOneByOne = false;
assessment.questionStatus =
{};
assessment.questionStatus.NOT_MODIFIED = 0;
assessment.questionStatus.MODIFIED = 1;
assessment.questionStatus.SAVE_ATTEMPTED = 2;
assessment.questionStatus.FAILED_SAVE = 3;
assessment.failedSaveCount = 0;
assessment.SAVE_ATTEMPTS_BETWEEN_NOTIFICATION = 3; // After this many failed-save attempts, alert the user so they can try to take action. (see assessment.autoSaveInterval for seconds between attempt)
assessment.STATUS_BAR_OFFSET = 53; // in px
assessment.STATUS_BAR_OFFSET_IN_STUDENT_PREVIEW = 7; // in px
/**
 * ************************ methods related to pool and test canvas per question add/edit/ copy/
 * remove*******************
 */

function findAssessmentForm()
{
  var assessmentForm = null;

  var documentForms = document.getElementsByTagName( 'form' );
  assessmentForm = $A( documentForms ).find( function( documentForm )
  {
    var theAction = $( documentForm ).readAttribute( "action" );
    return theAction ? theAction.indexOf( "webapps/assessment/" ) != -1 : false;
  } );

  return assessmentForm;
}

function submit( method, theForm )
{
  if ( !validateForm() )
  {
    return false;
  }

  if ( !theForm )
  {
    // no form specified so try to find it
    theForm = findAssessmentForm();
  }

  if ( method == "createNew" )
  {
    theForm.elements.assessmentId.value = null;
  }

  theForm.elements.method.value = method;
  theForm.submit();
  return false;
}

function getFormByInputElement( elementName )
{
  var element = document.getElementsByName( elementName )[ 0 ];
  return element.form;
}

// TODO: Rewrite this file to put all these methods into a namespace like assessment.XXX
function modifyAssessment()
{
  submit( 'modifyAssessment' );
}

function setQuestionId( questionId )
{
  getFormByInputElement( "questionId" ).questionId.value = questionId;
}

function modifyContentSettings( val )
{
  // properties|feedback|presentation|metadata
  submit( val );
}

assessment.addQuestionBefore = function( sectionId, qId )
{
  // automatically check the checkbox, when the context menu action is intiated
  var theForm = getFormByInputElement( "relativeId" );
  assessment.checkTheCheckBox( qId );
  theForm.sectionId.value = sectionId;
  theForm.relativeId.value = qId;
  submit( 'addQuestionBefore', theForm );
};

assessment.addQuestionAfter = function( sectionId, qId )
{
  // automatically check the checkbox, when the context menu action is intiated
  assessment.checkTheCheckBox( qId );
  var theForm = getFormByInputElement( "relativeId" );
  theForm.sectionId.value = sectionId;
  theForm.relativeId.value = qId;
  submit( 'addQuestionAfter', theForm );
};

assessment.fitOnScreen = function( baseElem, elem, left, ypos )
{
  var bodyHeight = $( document.body ).getHeight();
  var viewportScrollOffset = document.viewport.getScrollOffsets();
  var topOfScreen = viewportScrollOffset[1];
  var height = elem.getHeight();
  var menuAbove = false;
  var menuOver = false;
  if ( ( height + ypos - topOfScreen ) > bodyHeight )
  {
    menuAbove = true;
    ypos = ypos - height; // position above the element with the bottom of the flyout where the top would otherwise have been.
  }
  // Don't start off the top of the screen
  if ( ypos < topOfScreen)
  {
    menuOver = true;
    ypos = topOfScreen;
  }
  if ( ypos < 0 )
  {
    menuOver = true;
    ypos = 0;
  }

  var bodyWidth = document.viewport.getWidth();
  var width = elem.getWidth();
  var leftOfScreen = viewportScrollOffset[0];
  if ( (left + width - leftOfScreen ) > bodyWidth)
  {
    left = leftOfScreen + bodyWidth - width;
  }
  // Do not worry about checking left < leftOfScreen - if it is then force the user to scroll their window
  if (left < 0)
  {
    left = 0;
  }

  if (menuAbove)
  {
    baseElem.addClassName('menuAbove');
    baseElem.removeClassName('menuBelow');
  }
  else
  {
    baseElem.removeClassName('menuAbove');
    baseElem.addClassName('menuBelow');
  }

  if (menuOver)
  {
    baseElem.addClassName('menuOver');
  }
  else
  {
    baseElem.removeClassName('menuOver');
  }


  if ( height > bodyHeight )
  {
    // If too big to fit on the screen, set it to the height of the screen and allow scrollbars inside
    elem.setStyle(
    {
        height : bodyHeight + "px",
        overflowY : "auto",
        left : left + "px",
        top : ypos + "px"
    } );
  }
  else
  {
    elem.setStyle(
    {
      height: "auto",
      left : left + "px",
      top : ypos + "px"
    } );
  }
};

assessment.initAddBeforeAfterFlyout = function(before, qId, position, qTitle)
{
  // We want to use the updated dragdrop order of the element incase it has been moved since pageload.
  // We have left the position variable for this function incase the dragdrop no longer functions to
  // atleast allow the process of adding the question into the test.
  var items = dragdrop.getControllerObjById( 'pageListReorderControls' );
  if ( items.itemOrder )
  {
    //Positions for QTI are 1 based so need to get the 1 base index of the element for before and 1 base index + 1 for after.
    position = ( before ) ? items.itemOrder.indexOf( qId ) + 1 : items.itemOrder.indexOf( qId ) + 2;

  }
  assessment.questionFlyout = new assessment.addQuestionFlyout( {before: before, qId: qId, position: position, qTitle: qTitle});
};
assessment.addQuestionFlyout = Class.create();
assessment.addQuestionFlyout.prototype =
{
   initialize : function ( params )
   {
     this._params = Object.extend(
                                  {
                                      before : null,
                                      qId : null,
                                      position : 0,
                                      qTitle : null
                                  }, params );

     var formDiv = $('addBeforeAfter');
     var label = formDiv.select('.quickAddPalHeader')[0];
     if (this._params.before)
     {
       label.innerHTML = page.bundle.getString('add.question.before.title', this._params.qTitle);
       this.baseElem = $('addBeforeLink_'+this._params.qId);
     }
     else
     {
       label.innerHTML = page.bundle.getString('add.question.after.title', this._params.qTitle);
       this.baseElem = $('addAfterLink_'+this._params.qId);
     }
     this.baseElem.addClassName('forceVisible');
     // Start by positioning under the link
     var offset = Position.cumulativeOffset(this.baseElem);
     formDiv.setStyle(
     {
       display : "block",
       width: "auto",
       height: "auto"
     });
     var width = formDiv.getWidth();
     var left = offset[0];
     var baseWidth = Element.getWidth(this.baseElem);
     left = left + (baseWidth/2) - (width/2);
     var ypos = offset[1] + (Element.getHeight(this.baseElem)/2);
     assessment.fitOnScreen(this.baseElem, formDiv, left, ypos);

     var links = formDiv.getElementsByTagName( 'a' );
     $A(links).each( function( elem )
     {
       var bbhref = elem.getAttribute("bb:href");
       if (bbhref)
         {
         elem.href = bbhref + this._params.position + ")";
         }
     }.bind(this) );
     links[ 0 ].focus();
     this.closeListener = this.closeOnClickEvent.bindAsEventListener(this);
     this.closeEventListener = this.closeEvent.bindAsEventListener(this);
     Event.observe( links[0], 'keydown', this.onKeyDownFirstLink.bindAsEventListener(this));
     Event.observe( links[links.length-1], 'keydown', this.onKeyDownLastLink.bindAsEventListener(this));
     Event.observe( formDiv, 'keydown', this.onKeyDown.bindAsEventListener(this) );
     Event.observe( document.body, 'click', this.closeListener );
     Event.observe( this.baseElem, 'click', this.closeEventListener );
   },

   onKeyDown : function(event)
   {
     var key = event.keyCode || event.which;
     switch ( key )
     {
       case Event.KEY_ESC:
         this.closeQuestionFlyout(true);
         Event.stop( event );
         break;
       default :
         break;
     }
   },

   onKeyDownFirstLink : function(event)
   {
     this.onKeyDownFirstLastLink(event, true);
   },

   onKeyDownLastLink : function(event)
   {
     this.onKeyDownFirstLastLink(event, false);
   },

   onKeyDownFirstLastLink : function(event, first)
   {
     var key = event.keyCode || event.which;
     switch ( key )
     {
       case Event.KEY_TAB:
         if ((first && event.shiftKey) || (!first && !event.shiftKey))
         {
          this.closeQuestionFlyout(true);
          Event.stop( event );
         }
         break;
       default :
         break;
     }
   },

   closeEvent : function (event)
   {
     this.closeQuestionFlyout(false);
     Event.stop(event);
   },

   closeOnClickEvent : function (event)
   {
     this.closeQuestionFlyout(false);
   },

   closeQuestionFlyout : function(setFocusOnBase)
   {
     $( "addBeforeAfter" ).style.display = "none";
     this.baseElem.removeClassName('forceVisible');
     Event.stopObserving(this.baseElem, 'click', this.closeEventListener);
     Event.stopObserving(document.body, 'click', this.closeListener);
     if (setFocusOnBase)
     {
       this.baseElem.focus();
     }
   }
};

function addNGQuestion( sectionId, qtype, position )
{
  var theForm = getFormByInputElement( "questionType" );
  theForm.questionType.value = qtype;
  theForm.sectionId.value = sectionId;
  theForm.position.value = position;
  submit( 'addQuestion', theForm );
}

assessment.modifyAssessmentInfo = function()
{
  submit( 'modifyAssessmentInfo' );
}

assessment.modifyDeployOptions = function()
{
  submit( 'modifyDeployOptions' );
}

assessment.modifyHelper = function( questionId, method, isLinked )
{
  // automatically check the checkbox, when the context menu action is intiated
  assessment.checkTheCheckBox( questionId );
  var theForm = getFormByInputElement( "questionId" );
  setQuestionId( questionId );
  getFormByInputElement( "isLinkedQuestion" ).isLinkedQuestion.value = isLinked;
  submit( method, theForm );
};

assessment.modifyQuestion = function( questionId )
{
  assessment.modifyHelper( questionId, 'modifyQuestion', 'false' );
};

function modifyRandomBlock( questionId )
{
  assessment.modifyHelper( questionId, 'modifyRandomBlock', 'false' );
}

function modifyLinkQuestion( questionId, blockId )
{
  getFormByInputElement( "referencingQuestionId" ).referencingQuestionId.value = blockId;
  assessment.modifyHelper( questionId, 'modifyQuestion', 'true' );
}

function copyQuestion( sectionId, questionId )
{
  // automatically check the checkbox, when the context menu action is intiated
  assessment.checkTheCheckBox( questionId );
  var theForm = getFormByInputElement( "sectionId" );
  theForm.sectionId.value = sectionId;
  setQuestionId( questionId );
  submit( 'copyQuestion', theForm );
}

function copyLinkQuestion( sectionId, questionId, qbId )
{
  // automatically check the checkbox, when the context menu action is intiated
  assessment.checkTheCheckBox( questionId );
  var theForm = getFormByInputElement( "questionId" );
  theForm.sectionId.value = sectionId;
  theForm.questionBlockId.value = qbId;
  setQuestionId( questionId );
  submit( 'copyLinkQuestion', theForm );
}

function remove( id, type )
{
  if ( assessment.isInUse )
  {
    var suffix = ( assessment.type == 'Survey' ? '.survey' : '' );
    if ( !type )
    {
      assessment.removeEntity( id, page.bundle.getString( "confirm.delete_question.regrade" + suffix ) );
    }
    else if ( type == 'question_link' )
    {
      assessment.removeEntity( id, page.bundle.getString( "confirm.remove_question_link.regrade" + suffix ) );
    }
    else
    {
      assessment.removeEntity( id, page.bundle.getString( "confirm.delete_item.regrade" + suffix ) );
    }
  }
  else
  {
    assessment.removeEntity( id, page.bundle.getString( "confirm.delete_item" ) );
  }
}

assessment.pushPool = function( poolId )
{
  submit( 'pushPool' );
}

assessment.removeEntity = function( id, message )
{
  if ( window.confirm( message ) )
  {
    // automatically check the checkbox, when the context menu action is intiated
    assessment.checkTheCheckBox( id );
    var theForm = getFormByInputElement( "questionId" );
    setQuestionId( id );
    submit( 'remove', theForm );
  }
};

function reposition( id, position )
{
  setQuestionId( id );
  var theForm = getFormByInputElement( "questionId" );
  theForm.position.value = position;
  submit( 'reposition', theForm );
}

assessment.submitModifyQuestion = function()
{
  submit( 'modifyQuestion' );
};

assessment.cancelWarning = function()
{
  var theForm = getFormByInputElement( "methodEx" );
  theForm.elements.methodEx.value = 'modifyAssessment';
  theForm.submit();
  return false;
};

function isCheckbox( element )
{
  return ( element && element.type && element.type == "checkbox" );
}

/** ***************** methods related to bulk update logic on the test/pool canvas******************** */
assessment.removeAll = function( container, showCount )
{
  var questionBlockElements = $$( 'input.questionBlock' );
  var i, parentBlockNotSelected = false, questionBlockVals = {};
  for ( i = 0; i<questionBlockElements.length; i++ )
  {
    if ( isCheckbox( questionBlockElements[i] ) )
    {
      // if there are question sets, store the state of the set-level check box
      questionBlockVals[ "questionIds" + questionBlockElements[i].value ] = questionBlockElements[i].checked;
    }
  }
  var count = 0;
  var inputs = list.checkboxes.get( container );
  for ( var i = 0; i < inputs.length; i++ )
  {
    if ( isCheckbox( inputs[ i ] ) && inputs[ i ].checked )
    {
      // LRN-72093 do not count questions selected from sets, since removing them without deleting the entire set
      // is possible only when there are no student attempts and in that case removal is handled by removeQuestionsFromBlock
      if ( !inputs[i].id.startsWith( "questionBlockList" ) )
      {
        count++;
      }
      else
      {
        if ( !questionBlockVals[ inputs[i].name ] )
        {
        	parentBlockNotSelected = true;
        }
      }
    }
  }
  if ( parentBlockNotSelected &&  assessment.isInUse )
  {
    alert( page.bundle.getString( "set.cannot.delete.in_use" ) );
  }
  else if ( showCount ? window.confirm( page.bundle.getString( "confirm.delete_items_count", count ) ) : window
      .confirm( page.bundle.getString( "confirm.delete_items" ) ) )
  {
    submit( 'removeBulk' );
  }
};

assessment.removeAllPublished = function( message )
{
  if ( window.confirm( message ) )
  {
    submit( 'removeBulk' );
  }
};

assessment.updatePointsForAll = function()
{
  var element = document.getElementsByName( "points_bulk" );
  if ( assessment.validatePoints( element ) &&
       ( !assessment.isInUse || confirm( page.bundle.getString( "confirm.points_change.regrade_warning" ) ) ) )
  {
    submit( 'updatePointsBulk' );
  }
  return false;
};

assessment.updatePointsInput = function( event )
{

  var elements = document.getElementsByName( "points_bulk" );
  var element = Event.findElement( event );
  var pointsValue = element.value;

  if ( elements )
  {
    elements[ 0 ].value = pointsValue;
    elements[ 1 ].value = pointsValue;
  }

};

/** ************************* common js methods for assessments********************************************* */

/** validate Input Field value * */
assessment.validateMiniFlyoutInputValue = function( element )
{
  var value = null;
  if ( $( element ) )
  {
    value = $( element ).value;
  }
  if ( !value )
  {
    return page.bundle.getString( "update.input.value" );
  }

  if ( !isNumeric( value, false ) )
  {
    return page.bundle.getString( "update.input.valid.value" );
  }
  return "";
};

assessment.validatePoints = function( element )
{
  if ( element )
  {
    var pointsTextBoxTop = element[ 0 ];
    var pointsTextBoxBot = element[ 1 ];
    var pointsValue = pointsTextBoxTop.value;

    //Does not matter if we pass in the value of top/bottom text box, as the values mirror each other in the GUI.
    return assessment.validateNumericInput( pointsTextBoxTop, pointsTextBoxBot, pointsValue, page.bundle.getString( "update.points.value" ),
                                            page.bundle.getString( "update.points.valid.value" ), true );
  }
  return true;
};

assessment.validateNumericInput = function( textBoxTop, textBoxBot, value, blankMsg, badMsg, isFloat )
{
  var checkForFloats = false;
  var numFormat = LOCALE_SETTINGS.getString( 'float.format' );
  var isValidNum = false;
  var re, trimmedVal;

  trimmedVal = value.trim();
  if ( isFloat != 'null' )
  {
    checkForFloats = true;
  }
  if ( !value )
  {
    alert( blankMsg );
    textBoxTop.focus();
    return false;
  }
  var numVal = null;
  if ( !checkForFloats )
  {
    numVal = parseInt( value, 10 );
    isValidNum = ( !isNaN( numVal ) && numVal >= 0 );
  }
  else if ( typeof ( numFormat ) != 'undefined' )
  { // hand parse for l10n
    re = new RegExp( numFormat );
    isValidNum = ( trimmedVal.search( re ) === 0 );
  }
  else
  {
    // try to use platform native (non-localized)
    numVal = parseFloat( trimmedVal );
    isValidNum = !isNaN( numVal );
    if ( isValidNum && numVal.toString().length != trimmedVal.length )
    {
      /* Allow strings with trailing zeros to pass */
      re = /^[\.0]+$/;
      isValidNum = re.test( trimmedVal.substring( numVal.toString().length ) );
    }
  }
  if ( !isValidNum )
  {
    alert( badMsg );
    textBoxTop.value = "";
    textBoxBot.value = "";
    textBoxTop.focus();
    return false;
  }
  return true;
};

function back()
{
  submit( 'back' );
}

function persistDisplayPreference( element, value )
{
  ClientCache.setItem(element,value);
}

assessment.refreshParent = function( url )
{
  if ( window.opener )
  {
    if (window.opener.top.frames.content && window.opener.top.frames.content.id == 'content')
    {
      //Firefox and IE
      if ( window.opener.top.frames.content.location && window.opener.top.frames.content.location.href )
      {
        window.opener.top.frames.content.location.href = url;
      }
      else
      {
        //Chrome and RespondUS
        window.opener.top.frames.location.href = url;
      }
    }
    else
    {
      window.opener.location.href = url;
    }
    if ( window.opener.progressWindow )
    {
      window.opener.progressWindow.close();
    }
    window.close();
  }
  else
  {
    // We expected to be in a new window, but aren't. Perhaps this was a link from an announcement?
    window.location = url;
  }
};

assessment.checkTheCheckBox = function( elementId )
{
  if ( $s( 'content_listContainer_questionIds' + elementId ) )
  {
    $s( 'content_listContainer_questionIds' + elementId ).checked = true;
  }

};

assessment.unCheckTheCheckBox = function( elementId )
{
  if ( $s( 'content_listContainer_questionIds' + elementId ) )
  {
    $s( 'content_listContainer_questionIds' + elementId ).checked = false;
  }
};

var startX; // set x offset of bar in pixels
var startY;
var padding; // status bar y offset so it appears right below the insructions block
var verticalpos = "fromtop"; // enter "fromtop" or "frombottom"

function setPadding( pad )
{
  padding = pad;
}

function iecompattest()
{
  return ( document.compatMode && document.compatMode != "BackCompat" ) ? document.documentElement : document.body;
}

function resetInstructionHeight()
{
  padding = ( $('student-preview-ribbon') && $('student-preview-ribbon').visible()
                ? assessment.STATUS_BAR_OFFSET_IN_STUDENT_PREVIEW
                : assessment.STATUS_BAR_OFFSET );
  startY = document.getElementById( "instructionBlock" ).offsetTop +
           document.getElementById( "instructionBlock" ).clientHeight + padding;
  startX = document.getElementById( "instructionBlock" ).offsetLeft;

  document.getElementById( "dataCollectionContainer" ).style.position = "relative";

  var tbh = document.getElementById( "topbar" ).clientHeight;
  document.getElementById( "containerdiv" ).style.paddingBottom = ( 32 + tbh ) + "px";
  if ( document.getElementById( "topbar" ).offsetTop !== 0 )
  {
    document.getElementById( "dataCollectionContainer" ).style.top = tbh + "px";
  }

}

function staticbar()
{
  var ns = ( navigator.appName.indexOf( "Netscape" ) != -1 ) || window.opera;
  var d = document;

  function ml( id )
  {
    var el = d.getElementById( id );
    el.style.visibility = "visible";
    if ( d.layers )
    {
      el.style = el;
    }
    el.sP = function( x, y, r )
    {
      this.style.left = x + "px";
      //extraOffsetTopSpace sets the Y offset adjustment of the question status bar.
      var extraOffsetTopSpace = -90;
      if ($('globalNavPageNavArea'))
      {
        //if the div globalNavPageNavArea does not exist in case of ultra is disabled, the question status bar needs be pushed down accordingly.
        extraOffsetTopSpace = extraOffsetTopSpace + document.getElementById( "globalNavPageNavArea" ).clientHeight;
      }
      var elementBottom = document.getElementById( "instructionBlock" ).getBoundingClientRect().bottom;
      if(elementBottom >= 0 && elementBottom <= window.innerHeight)
      {
       this.style.top = elementBottom + 1 + "px";
      }
      else
      {
        this.style.top="0px";
      }
      if ( r > -1 )
      {
        this.style.right = r + "px";
      };
      // set the assessmentPortlet's width to the width of the instructionBlock width (including padding and margin).
      document.getElementById("topbar").style.width = $('instructionBlock').measure('border-box-width') + 'px';
    };
    el.y = startY;
    return el;
  }

  window.stayTopLeft = function()
  {
    var right = -1;
	var ftlobjX = 0;
	var ftlobjY = 0;
	var pY = ns ? window.pageYOffset : iecompattest().scrollTop;
    if ( pY < startY )
    {
      ftlobjY = startY - pY;
      document.getElementById( "dataCollectionContainer" ).style.top = document.getElementById( "topbar" ).clientHeight +
                                                                       8 + "px";
    }
    else
    {
      ftlobjY = 0;
    }
    ftlobjX = document.getElementById( "instructionBlock" ).offsetLeft;
    if ( page.util.isRTL() )
    {
      right = document.documentElement.clientWidth -
              ( ftlObj.x + document.getElementById( "instructionBlock" ).offsetWidth );
    }
    window.ftlObj.sP( ftlobjX, ftlobjY, right );

    setTimeout( "stayTopLeft()", 20 );
  };
  resetInstructionHeight();
  Event.observe( window, 'resize', resetInstructionHeight );
  window.ftlObj = ml( "topbar" );
  window.stayTopLeft();
}

var AIM =
{

    frame : function( c )
    {

      var n = 'f' + Math.floor( Math.random() * 99999 );
      var d = document.createElement( 'DIV' );
      d.innerHTML = '<iframe style="display:none" src="about:blank" id="' + n + '" name="' + n +
                    '" onload="AIM.loaded(\'' + n + '\')"></iframe>';
      document.body.appendChild( d );

      var i = document.getElementById( n );
      if ( c && typeof ( c.onComplete ) == 'function' )
      {
        i.onComplete = c.onComplete;
      }

      return n;
    },

    form : function( f, name )
    {
      f.setAttribute( 'target', name );
    },

    submit : function( f, c )
    {
      AIM.form( f, AIM.frame( c ) );
      if ( c && typeof ( c.onStart ) == 'function' )
      {
        return c.onStart();
      }
      else
      {
        return true;
      }
    },

    loaded : function( id )
    {
      var i = document.getElementById( id );
      var d;
      if ( i.contentDocument )
      {
        d = i.contentDocument;
      }
      else if ( i.contentWindow )
      {
        d = i.contentWindow.document;
      }
      else
      {
        d = window.frames[ id ].document;
      }
      if ( d.location.href == "about:blank" )
      {
        return;
      }

      if ( typeof ( i.onComplete ) == 'function' )
      {
        i.onComplete( d.body.innerHTML );
      }
    }

};

function hideElement( element )
{
  var msgspan = element;
  var msgimg = element + "img";

  document.getElementById( msgspan ).style.display = "none";
  document.images[ msgimg ].src = "/images/ci/ng/more_options_dark.gif";
  var alt = page.bundle.getString( 'expandCollapse.expand.section.nocolon' );
  document.images[ msgimg ].title = alt;
  document.images[ msgimg ].alt = alt;
}

function showElement( element )
{
  var msgspan = element;
  var msgimg = element + "img";
  document.getElementById( msgspan ).style.display = "inline";
  document.images[ msgimg ].src = "/images/ci/ng/less_options.gif";
  var alt = page.bundle.getString( 'expandCollapse.collapse.section.nocolon' );
  document.images[ msgimg ].title = alt;
  document.images[ msgimg ].alt = alt;
}

/*
 * sticky : whether to persist the display preference; true if null/undefined
 */
function toggleElement( element, sticky )
{
  if( undefined === sticky || null === sticky )
  {
    sticky = true;
  }

  var curStyle = document.getElementById( element ).style.display;
  if ( curStyle == "" || curStyle == "inline" )
  {
    hideElement( element );
    if( sticky )
    {
      persistDisplayPreference( element, 'none' );
    }
  }
  else
  {
    showElement( element );
    if( sticky )
    {
      persistDisplayPreference( element, 'inline' );
    }
  }
  resetInstructionHeight();
}

if ( !window.takeAssessment )
{
  var takeAssessment =
  {};

  takeAssessment.testInformationMap = {};
  takeAssessment.initiateTestInformation = function( qtiAssessmentPlusAttemptId )
  {
    var showInformationLabel = page.bundle.getString( "take.show.test.information" );
    var hideInformationLabel = page.bundle.getString( "take.hide.test.information" );

    // we don't use stickiness in page.ItemExpander because we have to update statusBlock once the test information gets updated with the cached stickiness value
    takeAssessment.testInformationMap[qtiAssessmentPlusAttemptId] = new page.ItemExpander( 'instructionsExpander' + qtiAssessmentPlusAttemptId, 'instructionsContainer' + qtiAssessmentPlusAttemptId, showInformationLabel, hideInformationLabel, null, null, null, null, null, false, null, true );
    takeAssessment.testInformationMap[qtiAssessmentPlusAttemptId].qtiAssessmentPlusAttemptId = qtiAssessmentPlusAttemptId;

    // obtain the cached expand/collapse value for the user
    var current_course_id = ( (typeof course_id != "undefined") && course_id !== null ) ? course_id : "";
    takeAssessment.applyCachedExpColState.bind( takeAssessment.testInformationMap[qtiAssessmentPlusAttemptId] )(ClientCache.getItem('instructionsExpander' + qtiAssessmentPlusAttemptId + current_course_id));

    takeAssessment.registerInstructionsExpanderOnClickEventListener( qtiAssessmentPlusAttemptId );
  };

  takeAssessment.registerInstructionsExpanderOnClickEventListener = function( qtiAssessmentPlusAttemptId )
  {
    Event.stopObserving( 'instructionsExpander' + qtiAssessmentPlusAttemptId, "click" );
    Event.observe( 'instructionsExpander' + qtiAssessmentPlusAttemptId, "click", takeAssessment.onClickInstructionsExpander.bindAsEventListener( takeAssessment.testInformationMap[qtiAssessmentPlusAttemptId] ) );
  };

  takeAssessment.applyCachedExpColState = function ( response )
  {
    var originalExpanded = this.expanded;

    // default when there is no cached value would be 'expanded'
    var cachedExpanded = true;
    if ( response !== undefined && response !== null && response.length > 0 )
    {
      if ( response == 'true' )
      {
        cachedExpanded = true;
      }
      else
      {
        cachedExpanded = false;
      }
    }
    if ( originalExpanded != cachedExpanded )
    {
      this.expandCollapse(originalExpanded);
    }
    takeAssessment.repositionStatusBlock();
  };

  takeAssessment.onClickInstructionsExpander = function( event )
  {
    Event.stop( event );

    this.onToggleClick();
    takeAssessment.repositionStatusBlock();

    // save the expand/collapse state for the test information section to the course user settings cache
    var current_course_id = ( (typeof course_id != "undefined") && course_id !== null ) ? course_id : "";
    ClientCache.setItem('instructionsExpander' + this.qtiAssessmentPlusAttemptId + current_course_id, this.expanded);
  };

  takeAssessment.repositionStatusBlock = function()
  {
    // reposition statusBlock appropriately by using its button toggle
    toggleElement( 'statusBlock', false );
    toggleElement( 'statusBlock', false );
  };
}

/**
 * ******************************************* methods related to lightbox preview in pool/test
 * canvas*******************
 */

assessment.previewLightbox = null;
assessment.copyLinkLightbox = null;

assessment.showLightBox = function( event, baseContainer, numparents, previewUrl )
{
  var e = event || window.event; // IE does not capture the event
  if ( e && e.type == 'click' )
  {
    Event.stop( e );
  }
  if ( !assessment.previewLightbox )
  {
    assessment.previewLightbox = new lightbox.Lightbox(
    {
        contents : '',
        defaultDimensions :
        {
            w : 500,
            h : 375
        },
        useDefaultDimensionsAsMinimumSize : true,
        verticalBorder : 125,
        horizontalBorder : 125
    } );
  }
  assessment.previewLightbox.cfg.ajax =
  {
      url : previewUrl,
      loadExternalScripts : true
  };
  assessment.previewLightbox.cfg.content = null;
  assessment.previewLightbox.open();
};

assessment.showCopyLinkLightBox = function( url )
{
  var params = url.toQueryParams();
  if ( !assessment.copyLinkLightbox )
  {
    assessment.copyLinkLightbox = new lightbox.Lightbox(
    {
        contents : '',
        defaultDimensions :
        {
            w : 150,
            h : 200
        },
        useDefaultDimensionsAsMinimumSize : true,
        verticalBorder : 50,
        horizontalBorder : 50
    } );
  }
  assessment.copyLinkLightbox.cfg.ajax =
  {
    url : '/webapps/assessment/do/authoring/questionSearch?method=copyLink&discoverUrl=' + encodeURIComponent( url ) +
          '&course_id=' + params.course_id
  };
  assessment.copyLinkLightbox.cfg.content = null;
  assessment.copyLinkLightbox.cfg.closeOnBodyClick = false;
  assessment.copyLinkLightbox.open();
};

assessment.showDiscover = function( url, title, width, height )
{
  assessment.submitDrawerUrl = url;
  var screenX = Math.floor( ( screen.width ) / 2 ) - Math.floor( width / 2 );
  var screenY = Math.floor( ( screen.height ) / 2 ) - Math.floor( height / 2 ) - 20;
  var top = screenY;
  var left = screenX;
  var features = "'" + 'toolbar=no,scrollbars=yes,status=yes,resizable=yes,top=' + top + ',left=' + left + ',screenX=' +
                 screenX + ',screenY=' + screenY + ',width=' + width + ',height=' + height + "'";
  var discover = window.open( url, title, features );
  if ( window.focus )
  {
    if ( discover )
    {
      discover.focus();
    }
    else
    {
      alert( page.bundle.getString( "pop.up.blocker.enabled" ) );
    }
  }
};

assessment.discoverOptions = function( url, title, width, height, hideCopyLink, position )
{
  if (position)
  {
    // If position is defined then we want to discover inline, not in a popup.
    document.location = url + '&position=' + position;
    return;
  }
  if ( !hideCopyLink )
  {
    // check if the UserPreference is set in session
    UserDataDWRFacade.getStringPermScope( "AssessmentUtils.DISCOVER_MODE_IS_LINKING", function( copyLinkSet )
    {
      if ( copyLinkSet == '' )
      {
        assessment.showCopyLinkLightBox( url );
      }
      else
      {
        assessment.showDiscover( url, title, width, height );
      }
    } );
  }
  else
  {
    assessment.showDiscover( url, title, width, height );
  }
};

assessment.onCloseCopyLinkLightbox = function( url )
{
  var copyLinkId = $( 'copylink_link' );
  var copyCopyId = $( 'copylink_copy' );
  var copyLinkValueSet = false;
  if ( copyLinkId && copyCopyId )
  {
    copyLinkValueSet = copyLinkId.checked || copyCopyId.checked;
  }
  if ( !copyLinkValueSet )
  {
    if ( window.confirm( page.bundle.getString( "confirm.set_copy_link" ) ) )
    {
      assessment.copyLinkLightbox.cfg.onClose = null;
      assessment.copyLinkLightbox.close();
      assessment.discoverOptions( url, 'discover', '900', '675', true );
    }
  }
  else
  {
    assessment.copyLinkLightbox.cfg.onClose = null;
    assessment.copyLinkLightbox.close();
    assessment.discoverOptions( url, 'discover', '900', '675', true );
  }
};

/** ************************** methods related to question block on the test canvas************************************ */

assessment.createQuestionBlock = function()
{

};

function addQuestionToBlock( questionId, assessmentType, assessmentId, courseId )
{
  var url = "/webapps/assessment/do/authoring/modifyQuestionBlock?method=addQuestionsToQuestionBlock" + "&questionId=" +
            questionId + "&assessmentType=" + assessmentType + "&assessmentId=" + assessmentId + "&course_id=" +
            courseId;

  assessment.discoverOptions( url, 'discover', '900', '675', true );
}
/** ******************** methods related to inline pool points flyout************************** */

assessment.poolFlyout = null;

assessment.initPoolFlyout = function( title )
{
  if ( !assessment.poolFlyout )
  {
    assessment.poolFlyout = new miniFlyout.MiniFlyout(
                                                       {
                                                           title : title,
                                                           miniFlyoutTemplate : "<label class='hideoff' for='#{inputFieldName}_id'>#{title}</label> <input id='#{inputFieldName}_id'type='text'  style='width: 2em;' size='3' value='0'  name='#{inputFieldName}'/> <a href='#' title='#{closeButtonName}'  bb_flyout_title='Cancel' class='genericButtonImg button-3-img'><img  alt='#{closeButtonName}' src='/images/ci/ng/remove_li.png'/></a> <a href='#' title='#{submitButtonName}' bb_flyout_title='Submit' class='genericButtonImg button-3-img'><img  alt='#{submitButtonName}' src='/images/ci/ng/checkmark_li.png'/></a>",
                                                           inputFieldName : "inline_points",
                                                           errorMessage : page.bundle.getString( "points.failure" ),
                                                           miniFlyoutDivClass : "liveArea liveArea-slim",
                                                           onChange : "return gradebook_utils.detectAllDecimals(this.value, '${pointsDecimalWarning}');",
                                                           onSubmitValidate : "return assessment.validateMiniFlyoutInputValue('inline_points_id')"
                                                       } );
  }
  miniFlyout.closeCurrentMiniFlyout();
};
assessment.showPoolFlyout = function( event, title, assessmentId, id, courseId )
{
  var e = event || window.event; // IE does not capture the event
  var aLink = Event.element( e );
  if ( e && e.type == 'click' )
  {
    Event.stop( e );
  }
  assessment.initPoolFlyout( title );
  assessment.poolFlyout.cfg.openLink = aLink;
  assessment.poolFlyout.cfg.containerId = aLink.parentNode.parentNode;
  assessment.poolFlyout.cfg.inputFieldDefaultSource = "ipoints_" + id;
  assessment.poolFlyout.cfg.inputFieldName = "inline_points";
  assessment.poolFlyout.cfg.onChange = "return gradebook_utils.detectAllDecimals(this.value, '${pointsDecimalWarning}');";
  assessment.poolFlyout.cfg.onSubmit = "return assessment.saveQuestionPoints('" + assessmentId + "','" + id + "','" +
                                       courseId + "',false, false, assessment.poolFlyout.cfg.containerId);";
  assessment.poolFlyout.open();
};

/** ************************************************* methods related to test canvas selection by type****************** */

assessment.selectByType = function( container )
{
  var selected = document.getElementsByName( 'selectbyQuestionType' )[ 0 ];// either use 0 or 1, since both are updated
                                                                            // to the same
  var checkboxes = list.checkboxes.get( container );
  for ( var i = 0; i < checkboxes.length; ++i )
  {
    checkboxes[ i ].checked = false;
  }
  var className = selected.options[ selected.selectedIndex ].value;
  checkboxes.each( function( e )
  {
    if ( e.className.trim() == className.trim() )
    {
      e.checked = true;
    }
  } );
  $( 'selectbyQuestionType_idTop' ).options[ selected.selectedIndex ].selected = true;
  $( 'selectbyQuestionType_idBot' ).options[ selected.selectedIndex ].selected = true;
};

assessment.toggleQuestionBlockDiv = function( rawId )
{
  var ul = $( 'questionBlockDiv' + rawId );
  var a = $( 'questionBlockDivLink' + rawId ).getElementsByTagName( 'a' )[ 0 ];
  Effect.toggle( ul, 'blind',
  {
    duration : 0.3
  } );
  if ( ul.style.display == "none" )
  {
    a.className = "itemHead itemHeadOpen";
  }
  else if ( ul.style.display == "block" || ul.style.display == "" )
  {
    a.className = "itemHead";
  }
  return false;
};

/** ************************ methods related to discover drawer functionality******************************************* */

assessment.inBasicDiscoverMode = function()
{
  if ( document.copyQuestionsForm.method.value == 'save' )
  {
    return true;
  }
  return false;
};

assessment.cancelDrawer = function()
{
  var myDrawer = drawer.model.getCurrentInstance();
  myDrawer.discard();
  document.copyQuestionsForm.elements.methodEx.value = 'cancel';
  document.copyQuestionsForm.submit();
  if ( window.opener )
  {
    // close question discovery popup
    window.close();
  }
  return false;
};

assessment.cancelRandomBlock = function()
{
  document.copyQuestionsForm.methodEx.value = 'cancel';
  document.copyQuestionsForm.submit();
  if ( window.opener !== null )
  {
    // close question discovery popup
    window.close();
  }
  return false;
};

function findAndDisableInputElements( el )
{
  if ( el === null )
  {
    return;
  }
  var elems = el.getElementsByTagName( 'input' );
  for ( var i = 0; i < elems.length; i++ )
  {
    el.addClassName( 'disabled' );
    el.disabled = true;
  }
}

/** **************** Ajax method related to Test/pool canvas************************************************** */

function postAndUpdateCanvas( form )
{
  var method = form.method.value;
  var assessmentId = form.assessmentId.value;
  var courseId = form.course_id.value;
  var nonceId = nonceUtil.getNonceId( 'bb-question-discover' );
  var questionId = "";
  if ( form.questionId )
  {
    questionId = form.questionId.value;
  }
  var url = "/webapps/assessment/do/authoring/copyQuestions?method=" + method + "&assessmentId=" + assessmentId +
            "&course_id=" + courseId + "&sectionId=" + form.sectionId.value + "&assessmentType=" +
            form.assessmentType.value + "&itemIds=" + form.itemIds.value + "&overridePoints=" +
            form.overridePoints.value + "&questionId=" + questionId + "&ajaxMode=true" +
            "&blackboard.platform.security.NonceUtil.nonce=" + nonceId.value;
  if ( form.searchCriterion !== null )
  {
    url = url + "&searchCriterion=" + encodeURIComponent( form.searchCriterion.value );
  }

  findAndDisableInputElements( $( 'cartSubmit' ) );
  var params = url.toQueryParams();
  url = url.split( "?" )[ 0 ];
  new Ajax.Request(
                    url,
                    {
                        method : 'post',
                        parameters : params,
                        onCreate : function()
                        {
                          document.body.style.cursor = 'progress';
                        },
                        onComplete : function( transport, json )
                        {
                          window.opener.location = "/webapps/assessment/do/authoring/modifyAssessment?method=modifyAssessment&assessmentId=" +
                                                   assessmentId + "&course_id=" + courseId;
                          if ( json !== null )
                          {
                            // capture any error message and display
                            if ( json.errorMessage )
                            {
                              // exception message looks ugly for the end-user, hence use a more user-friendly message
                              // to indicate the ajax refresh failed
                              new page.InlineConfirmation( "error", json.errorMessage, false );
                            }
                            else if ( json.successMessage )
                            {
                              // WIP
                              // var startingEl = window.parent.document.getElementById('blockstart_' + questionId);
                              // new page.NestedInlineFadeAwayConfirmation("success", json.successMessage, false,
                              // startingEl, false );
                            }
                          }
                          setTimeout( 'window.close()', 1500 );
                        },
                        onFailure : function( transport, json )
                        {
                          new page.InlineConfirmation( "error", "Failure post discover pop-up", false );
                        }
                    } );
}

assessment.submitRandomBlock = function()
{
  if ( $( 'listContainer_datatable' ) )
  {
    var searchCriterion = activeFilter.getSearchCriteriaInstance( false ).getSearchCriteriaAsXml();
    document.copyQuestionsForm.searchCriterion.value = searchCriterion;
    if ( window.opener )
    {
      postAndUpdateCanvas( document.copyQuestionsForm );
    }
    else
    {
      document.copyQuestionsForm.submit();
    }
  }
  else
  {
    alert( page.bundle.getString( "cannot.submit.with.no.matching.questions" ) );
  }
  return false;
};

/** **************** Ajax method related to Test/pool canvas************************************************** */

assessment.submitDrawer = function()
{
  var myDrawer = drawer.model.getCurrentInstance();
  var selectedItems = myDrawer.getItems( true );
  var i;
  var allIds = "";
  for ( i = 0; i < selectedItems.length; i++ )
  {
    var qId = selectedItems[ i ].itemId;
    var mode = selectedItems[ i ].mode;
    allIds += qId + ":" + mode + ",";
  }
  document.copyQuestionsForm.itemIds.value = allIds;
  myDrawer.discard();

  if ( window.opener )
  {
    postAndUpdateCanvas( document.copyQuestionsForm );
  }
  else
  {
    document.copyQuestionsForm.submit();
  }
  return false;
};

/** **************** Ajax method related to Test/pool canvas************************************************** */

assessment.OnCompleteUpdateCanvas = function( questionId, req, showNestedReceipt )
{

  var json = req.responseText.evalJSON( true );
  var pointsEl = $s( 'ipoints_' + questionId );
  var totalQuestionsCountEl = $s( 'totalNoQuestions' + questionId );
  var currentQuestionCountEl = $s( 'questionCount' + questionId );
  var totalBlockPointsEl = $s( 'totalPoints_' + questionId );
  var totalTestPointsEl = $s( 'totalTestPoints' );
  var totalQuestionsEl = $s( 'totalQuestions' );
  var startingEl = $s( 'blockstart_' + questionId );

  if ( !json.errorMessage && pointsEl && json.points )
  {
    // update per question points
    pointsEl.childNodes[ 0 ].nodeValue = json.points;
  }
  if ( !json.errorMessage && totalQuestionsCountEl && json.totalQuestionsCount )
  {
    // update per question points
    totalQuestionsCountEl.childNodes[ 0 ].nodeValue = json.totalQuestionsCount;
  }
  if ( !json.errorMessage && currentQuestionCountEl && json.currentQuestionsCount )
  {
    // update per question points
    currentQuestionCountEl.childNodes[ 0 ].nodeValue = json.currentQuestionsCount;
  }
  if ( !json.errorMessage && totalBlockPointsEl && json.totalBlockPoints )
  {
    // update the total points
    totalBlockPointsEl.childNodes[ 0 ].nodeValue = json.totalBlockPoints;
  }
  if ( !json.errorMessage && totalQuestionsEl && json.totalQuestions )
  {
    // update the total questions
    totalQuestionsEl.innerHTML = json.totalQuestions;
  }
  if ( !json.errorMessage && totalTestPointsEl && json.totalTestPoints )
  {
    // update total Test points, not for survey or pool
    totalTestPointsEl.innerHTML = json.totalTestPoints;
  }
  if ( showNestedReceipt )
  {
    if ( json.securityErrorMsg )
    {
      new page.NestedInlineConfirmation( "error", json.securityErrorMsg, true, startingEl, true );
    }
    else if ( json.successMessage )
    {
      if ( json.successMessage.indexOf( 'regrading_queued_status' ) > 0 )
      {
        // If we are displaying a confirmation including regrading status then DO NOT fade it away - let it stay and get
        // updated.
        new page.NestedInlineConfirmation( "success", json.successMessage, false, startingEl, true, null, null, false,
                                           false, null, 0, null, 'nested_save_receipt_' + questionId );
      }
      else
      {
        new page.NestedInlineFadeAwayConfirmation( "success", json.successMessage, false, startingEl, false );
      }
    }
  }
  assessment.result = json.errorMessage;
  assessment.setQuestionNumbers();
};

assessment.removeQuestionsFromBlock = function( listId, questionBlockId, courseId, assessmentId )
{
  var allcheckBoxes = list.checkboxes.get( listId );
  var checkedCount = 0;
  var ids = "";
  for ( var i = 0; i < allcheckBoxes.length; i++ )
  {
    var separator = ( i == ( allcheckBoxes.length - 1 ) ) ? "" : ',';
    if ( allcheckBoxes[ i ].checked )
    {
      checkedCount++;
      ids = ids + allcheckBoxes[ i ].value + separator;
    }
  }
  if ( window.confirm( page.bundle.getString( "confirm.delete_items_count", checkedCount ) ) )
  {

    // ajax request
    var nonceId = nonceUtil.getNonceId( 'bb-assessment-canvas' );
    var startingEl = document.getElementById( 'blockstart_' + questionBlockId );

    var url = "/webapps/assessment/do/authoring/modifyQuestionBlock?method=removeQuestionsFromQuestionBlock" +
              "&block_id=" + questionBlockId + "&course_id=" + courseId + "&assessment_id=" + assessmentId +
              "&questionIds=" + ids + "&blackboard.platform.security.NonceUtil.nonce=" + nonceId.value;

    var params = url.toQueryParams();
    url = url.split( "?" )[ 0 ];
    new Ajax.Request( url,
    {
        method : 'post',
        parameters : params,
        onCreate : function()
        {
          document.body.style.cursor = 'progress';
        },
        onComplete : function( req )
        {
          var json = req.responseText.evalJSON( true );
          document.body.style.cursor = 'default';
          nonceId.value = json.nonceId;
          inventoryList.ajaxPostOnClick( null, listId );
          if ( json.errorMessage )
          {
            new page.NestedInlineConfirmation( "error", json.errorMessage, false, startingEl, false );
          }
        },
        onSuccess : function( req )
        {
          assessment.OnCompleteUpdateCanvas( questionBlockId, req, true );

        },
        onFailure : function( req )
        {
          assessment.OnCompleteUpdateCanvas( questionBlockId, req, true );
        }
    } );
  }
};

assessment.result = "";
assessment.saveQuestionCount = function( assessmentId, blockId, courseId, forRandomBlock )
{
  var countEl = document.getElementsByName( 'question_count' )[ 0 ];
  var originalCountEl = document.getElementById( 'questionCount' + blockId );
  var originalCount = originalCountEl.childNodes[ 0 ].nodeValue;
  var newCount = countEl.value;
  if ( newCount == originalCount )
  {
    return "";
  }
  var nonceId = nonceUtil.getNonceId( 'bb-assessment-canvas' );
  var startingEl = document.getElementById( 'blockstart_' + blockId );

  var url = "/webapps/assessment/do/authoring/modify" + ( forRandomBlock ? "Random" : "Question" ) +
            "Block?method=saveQuestionCount" + "&block_id=" + blockId + "&course_id=" + courseId + "&new_count=" +
            newCount + "&assessment_id=" + assessmentId + "&blackboard.platform.security.NonceUtil.nonce=" +
            nonceId.value;

  new Ajax.Request( url,
  {
      method : 'post',
      asynchronous : false,
      onCreate : function()
      {
        document.body.style.cursor = 'progress';
      },
      onComplete : function( req )
      {
        var json = req.responseText.evalJSON( true );
        document.body.style.cursor = 'default';
        // set the new nonceId back
        nonceId.value = json.nonceId;
      },
      onSuccess : function( req )
      {
        assessment.OnCompleteUpdateCanvas( blockId, req, true );
      },
      onFailure : function( req )
      {
        assessment.OnCompleteUpdateCanvas( blockId, req, true );
      }
  } );
  return assessment.result;
};

assessment.updateExtraCredit = function( newExtraCreditValue, questionId )
{
  var extraCreditDiv = $( 'extra_credit_' + questionId );
  if ( extraCreditDiv )
  {
    if ( newExtraCreditValue )
    {
      extraCreditDiv.removeClassName( 'hidden' );
      extraCreditDiv.addClassName( 'extraCredit' );
    }
    else
    {
      extraCreditDiv.addClassName( 'hidden' );
      extraCreditDiv.removeClassName( 'extraCredit' );
    }
  }
};

assessment.updateFullCredit = function( newFullCredit, questionId )
{
  document.getElementById( 'original_fullCredit_value_' + questionId ).value = newFullCredit.toString();
  if ( newFullCredit )
  {
    document.getElementById( 'full_credit_' + questionId ).show();
  }
  else
  {
    document.getElementById( 'full_credit_' + questionId ).hide();
  }
};

// copied or linked question
assessment.saveQuestionPoints = function( assessmentId, questionId, courseId, isBlock, isInUse, containerId )
{
  var pointsToSave = document.getElementsByName( 'inline_points' );
  var extraCredit = $s( 'inline_points_extra_credit_id' );
  var newExtraCreditValue = false;
  if ( extraCredit )
  {
    newExtraCreditValue = extraCredit.checked;
  }
  var newPoints = pointsToSave[ 0 ].value;
  var originalPointsEl = document.getElementById( 'ipoints_' + questionId );
  var originalExtraCreditValue = false;
  var originalExtraCreditEl = $( 'extra_credit_' + questionId );
  if ( originalExtraCreditEl )
  {
    originalExtraCreditValue = !originalExtraCreditEl.hasClassName( 'hidden' );
  }
  var originalPoints;
  if ( originalPointsEl.childNodes )
  {
    originalPoints = originalPointsEl.childNodes[ 0 ].nodeValue;
  }
  var originalFullCredit;
  var newFullCredit;
  var fullCreditCheckbox = document.getElementById( 'inline_points_full_credit_' + questionId );
  if ( fullCreditCheckbox !== null )
  {
    newFullCredit = fullCreditCheckbox.checked;
    originalFullCredit = document.getElementById( 'original_fullCredit_value_' + questionId ).value;
  }
  if ( ( newPoints == originalPoints ) && ( originalExtraCreditValue == newExtraCreditValue ) &&
       ( !fullCreditCheckbox || ( originalFullCredit == newFullCredit.toString() ) ) )
  {
    return "";
  }
  if ( isInUse && !confirm( page.bundle.getString( "confirm.points_change.regrade_warning" ) ) )
  {
    return "";
  }
  var nonceId = nonceUtil.getNonceId( 'bb-assessment-canvas' );
  if ( !extraCredit )
  {
    newExtraCreditValue = "";
  }
  if ( !isBlock )
  {
    isBlock = false;
  }
  else
  {
    isBlock = true;
  }
  var url = "/webapps/assessment/do/authoring/modifyAssessment?method=updateQuestionPoints" + "&question_id=" +
            questionId + "&course_id=" + courseId + "&points_value=" + newPoints + "&extra_credit=" +
            newExtraCreditValue + "&assessment_id=" + assessmentId + "&is_Block=" + isBlock +
            "&blackboard.platform.security.NonceUtil.nonce=" + nonceId.value;
  if ( fullCreditCheckbox )
  {
    url = url + "&full_credit=" + newFullCredit;
  }

  new Ajax.Request( url,
  {
      method : 'post',
      asynchronous : false,
      onCreate : function()
      {
        document.body.style.cursor = 'progress';
      },
      onComplete : function( req )
      {
        var json = req.responseText.evalJSON( true );
        document.body.style.cursor = 'default';
        // set the new nonceId back
        nonceId.value = json.nonceId;
      },
      onSuccess : function( req )
      {
        var json = req.responseText.evalJSON( true );
        var showNestedReceipt = false;
        if ( !containerId )
        {
          showNestedReceipt = true;
        }
        assessment.OnCompleteUpdateCanvas( questionId, req, showNestedReceipt );
        if ( extraCredit )
        {
          assessment.updateExtraCredit( newExtraCreditValue, questionId );
        }
        if ( fullCreditCheckbox )
        {
          assessment.updateFullCredit( newFullCredit, questionId );
        }
        if ( !showNestedReceipt )
        {
          // show receipt in pool , table cell
          var status_msg = null;
          if ( json.successMessage != "" )
          {
            status_msg = $( 'status_msg_succ' );
          }
          var link = containerId.down( 1 );
          link.hide();
          containerId.appendChild( status_msg );
          ( status_msg ).show();
          setTimeout( function()
          {
            ( status_msg ).fade(
            {
              duration : 0.5
            } );
          }, 500 );

          setTimeout( function()
          {
            link.appear(
            {
              duration : 0.5
            } );
          }, 1000 );
          link.focus();
        }
      },
      onFailure : function( req )
      {
        new page.InlineConfirmation( "error", page.bundle.getString( "updatePointsFailed" ), false );
      }
  } );

  if ( assessment.result == "" )
  {
    ariaLabel = originalPointsEl.getAttribute( "aria-label" );
    originalPointsEl.setAttribute( "aria-label", ariaLabel.replace( /(\d+)/, newPoints ) );
  }

  return assessment.result;
};

assessment.setDefaultLinkingMode = function( isLinkingMode, courseIdStr, nonce )
{
  var courseId = courseIdStr || document.copyQuestionsForm.course_id.value;
  var url = "/webapps/assessment/do/authoring/questionSearch?method=saveLinkingMode" + "&linkingMode=" + isLinkingMode +
            "&course_id=" + courseId + "&blackboard.platform.security.NonceUtil.nonce.ajax=" + nonce;

  new Ajax.Request( url,
  {
      method : 'post',
      onCreate : function()
      {
        document.body.style.cursor = 'progress';
      },
      onComplete : function( transport, json )
      {
        document.body.style.cursor = 'default';
      },
      onSuccess : function( transport, json )
      {
      },
      onFailure : function( transport, json )
      {
      }
  } );
};

assessment.setDisplayFullText = function( displayFull, listId )
{
  var extras = [];
  // Note - Constants.DISPLAY_FULL_TEXT = "displayFullText"
  extras.displayFullText = displayFull;
  inventoryList.ajaxPostOnClick( null, listId, extras, true );
};

assessment.rewriteSectionForScreenReader = function( elementName )
{
  var element = document.getElementById( elementName );
  element.setAttribute( "aria-live", "assertive" );
  element.setAttribute( "aria-relevant", "all" );
  element.setAttribute( "aria-atomic", "true" );
  element.setAttribute( "aria-busy", "true" );
  var myContents = element.innerHTML;
  element.innerHTML = myContents;
  element.setAttribute( "aria-busy", "false" );
  return false;
};

assessment.clearQuestionModifiedStatuses = function()
{
  // Called on page load to make sure we don't have any stranded questions-to-monitor kicking around.
  assessment.questions_to_monitor = [];
  assessment.questions_to_monitor_index = 0;
};

assessment.QMonitor = Class.create();

assessment.QMonitor.prototype =
{
    initialize : function( entity, index )
    {
      this.index = index;
      Event.observe( entity, 'change', this.onChange.bindAsEventListener( this ) );
    },
    onChange : function( event )
    {
      assessment.questions_to_monitor[ this.index ].status = assessment.questionStatus.MODIFIED;
      assessment.setModifiedIcon( assessment.questions_to_monitor[ this.index ].qnum );
    }
};

assessment.getSaveButton = function( questionNum )
{
  var myButton = document.getElementById( "saveButton_" + questionNum );
  if ( !myButton )
  {
    if ( assessment.isOneByOne )
    {
      if ( questionNum == document.forms.saveAttemptForm.current_question.value )
      {
        myButton = document.getElementById( "saveAnswerSubmitId" ); // for one-at-a-time tests
      }
    }
  }
  return myButton;
};

assessment.setModifiedIcon = function( questionNum )
{
  var saveAnswerLabel = page.bundle.getString( 'takeSaveAnswer' );
  var myButton = assessment.getSaveButton( questionNum );
  if ( myButton )
  {
    myButton.value = saveAnswerLabel;
    Element.removeClassName( myButton, 'answerSavingButton' );
    Element.removeClassName( myButton, 'answerSavedButton' );
  }
  // TODO - Either rip this out or put in appropriate image, style, and text
  // NOTE - can't actually enable this until on-the-fly onchange support in the VTBE is done
  // (as opposed to the current on-unload check for change)
  // Also - would need to deal with leaving this image on-page in this scenario:
  // Save Q1
  // Modify Q1
  // Save Q2
  // -- at this point, we update the status icons and lose the modified icon for Q1
  /*
   * var mySpan =document.getElementById("span_"+questionNum); var myImg = document.getElementById("img_"+questionNum);
   * mySpan.className = "qIncomplete"; myImg.src = "/images/ci/gradebook/needs_grading.png"; // better icon myImg.alt =
   * "TODO: Incomplete"; myImg.height= "10"; myImg.width= "10";
   */
};

assessment.addQuestionToMonitor = function( qid, qnum, isFileUploadQuestion )
{
  var questionBlock = $( qid );
  assessment.questions_to_monitor[ assessment.questions_to_monitor_index ] =
  {};

  // TODO - is there a more efficient way to do this?
  $A( questionBlock.getElementsByTagName( '*' ) )._each( function( entity )
  {
    new assessment.QMonitor( entity, assessment.questions_to_monitor_index );
  } );
  assessment.questions_to_monitor[ assessment.questions_to_monitor_index ].qid = qid;
  assessment.questions_to_monitor[ assessment.questions_to_monitor_index ].qnum = qnum;
  // Status: 0 == not changed, 1 = changed, 2 = attempted to be auto-saved since last change
  assessment.questions_to_monitor[ assessment.questions_to_monitor_index ].status = assessment.questionStatus.NOT_MODIFIED;
  assessment.questions_to_monitor[ assessment.questions_to_monitor_index ].isFileUploadQuestion = isFileUploadQuestion;
  assessment.questions_to_monitor_index++;
};

assessment.remonitorFileUpload = function( qid, qnum )
{
  if ( assessment.questions_to_monitor_index > 0 )
  {
    var i = 0;
    for ( i = 0; i < assessment.questions_to_monitor_index; i++ )
    {
      if ( assessment.questions_to_monitor[ i ].qnum == qnum )
      {
        if ( assessment.questions_to_monitor[ i ].isFileUploadQuestion )
        {
          var questionBlock = $( qid );
          $A( questionBlock.getElementsByTagName( '*' ) )._each( function( entity )
          {
            new assessment.QMonitor( entity, i );
          } );
        }
        else
        {
          return;
        }
      }
    }
  }
};

assessment.questionBeingSaved = -1;
assessment.markQuestionAsSaved = function( qnum )
{
  assessment.markQuestionSaveStatus( qnum, assessment.questionStatus.NOT_MODIFIED );
};
assessment.markQuestionSaveStatus = function( qnum, status )
{
  if ( assessment.questions_to_monitor_index > 0 )
  {
    var i = 0;
    for ( i = 0; i < assessment.questions_to_monitor_index; i++ )
    {
      if ( assessment.questions_to_monitor[ i ].qnum == qnum )
      {
        assessment.questions_to_monitor[ i ].status = status;
      }
    }
  }
};
assessment.getQuestionStatus = function( qnum )
{
  if ( assessment.questions_to_monitor_index > 0 )
  {
    var i = 0;
    for ( i = 0; i < assessment.questions_to_monitor_index; i++ )
    {
      if ( assessment.questions_to_monitor[ i ].qnum == qnum )
      {
        return assessment.questions_to_monitor[ i ].status;
      }
    }
  }
  return 0;
};

assessment.hasUnsavedAnswers = function()
{
  if ( assessment.questions_to_monitor_index > 0 )
  {
    var i = 0;
    if ( typeof ( finalizeEditorsAnyChange ) == "function" )
    {
      finalizeEditorsAnyChange( assessment.vtbeChanged );
    }
    for ( i = 0; i < assessment.questions_to_monitor_index; i++ )
    {
      if ( assessment.questions_to_monitor[ i ].status != assessment.questionStatus.NOT_MODIFIED )
      {
        return true;
      }
      else if ( assessment.questions_to_monitor[ i ].isFileUploadQuestion )
      {
        // In IE, the assessment.QMonitor onchange handle disappears after the first file selection and I can't seem to
        // add it back.
        // This at least gets the saving to work so it doesn't appear totally broken. The button doesn't change to 'save
        // answer' immediately
        // after you attach a file a second time though, but we have to live with that for now.
        var actionDivName = 'file_upload_ans_' + assessment.questions_to_monitor[ i ].qid + '_selectedFileActions';
        var actionDiv = $( actionDivName );
        if ( actionDiv && actionDiv.visible() )
        {
          assessment.questions_to_monitor[ i ].status = assessment.questionStatus.MODIFIED;
          return true;
        }
      }
    }
  }
  return false;
};

assessment.registerVTBEChange = function()
{
  if ( typeof ( registerOnChangeCallback ) == "function" )
  {
    registerOnChangeCallback( assessment.vtbeChangedCallback, assessment.getVtbeQuestionIndex );
  }

};

assessment.autoSaveExecutor = '';
assessment.nextQuestionToCheck = 0; // To avoid saving the same question too often, start on the 'next' question in a
                                    // subsequent pass.
assessment.autoSaveInterval = 10; // seconds
assessment.startAutoSave = function( interval )
{
  assessment.autoSaveInterval = interval;
  assessment.autoSaveExecutor = new PeriodicalExecuter( assessment.doAutoSave, assessment.autoSaveInterval );
};

assessment.stopAutoSave = function()
{
  if ( assessment.autoSaveExecutor != '' )
  {
    assessment.autoSaveExecutor.stop();
  }
};

assessment.toggleAutoSave = function( interval )
{
  assessment.stopAutoSave();
  if ( $s( 'autoSaveCheckbox' ).checked )
  {
    assessment.startAutoSave( interval );
  }
};

assessment.doAutoSave = function( pe )
{
  if ( assessment.submittingRightNow )
  {
    // Ignore if submitting right now
    return;
  }
  if ( assessment.savingRightNow )
  {
    // If we are already saving, do nothing right now.
    return;
  }
  var doneOne = false;
  if ( assessment.hasUnsavedAnswers() )
  {
    // Start at the next to check so we don't keep saving the same question over and over again
    // in the case of someone modifying an essay question while they have "later" questions that are unsaved.
    for ( var i = assessment.nextQuestionToCheck; i < assessment.questions_to_monitor_index; i++ )
    {
      var mystatus = assessment.questions_to_monitor[ i ].status;
      // skip questions where we attempted a save - if it is left in that state then it either means we are still
      // waiting for a response or that we failed to save for some reason and do not want to keep trying until the user
      // changes their answer
      if ( mystatus == assessment.questionStatus.MODIFIED || mystatus == assessment.questionStatus.FAILED_SAVE )
      {
        if ( doneOne )
        {
          // We can only submit one question per pass because otherwise the nonce fails. Switch
          // to a higher frequency to save all the outstanding questions faster.
          pe.stop();
          pe.frequency = 1;
          pe.registerCallback();
          assessment.nextQuestionToCheck = i;
          return;
        }
        assessment.questions_to_monitor[ i ].status = assessment.questionStatus.SAVE_ATTEMPTED; // flag to indicate
                                                                                                // we've already tied to
                                                                                                // auto-save this

        // Will be reset to 0 after a successful save or 1 if the user modifies their answer again.
        saveOneItem( assessment.questions_to_monitor[ i ].qid, assessment.questions_to_monitor[ i ].qnum, true, false );
        doneOne = true;
      }
    }
    if ( !doneOne && assessment.nextQuestionToCheck !== 0 )
    {
      // If we got here that means we had an unsaved answer, didn't save any in our loop, and didn't
      // start at the beginning. Reset our next-to-check to 0 and reschedule
      assessment.nextQuestionToCheck = 0;
      pe.stop();
      pe.frequency = 1;
      pe.registerCallback();
      return;
    }
  }
  if ( !doneOne )
  {
    // If we get here then we have "finished" auto-saving all that we thought we had to - make sure we start at
    // the beginning next time.
    assessment.nextQuestionToCheck = 0;
    if ( pe.frequency != assessment.autoSaveInterval )
    {
      pe.stop();
      pe.frequency = assessment.autoSaveInterval;
      pe.registerCallback();
    }
  }
};

assessment.vtbeChanged = function( ifr )
{
  var index = assessment.getVtbeQuestionIndex( ifr );
  assessment.vtbeChangedCallback( ifr, index );
};

assessment.vtbeChangedCallback = function( ifr, index )
{
  if ( index != -1 )
  {
    assessment.questions_to_monitor[ index ].status = assessment.questionStatus.MODIFIED;
    assessment.setModifiedIcon( assessment.questions_to_monitor[ index ].qnum );
  }
};

assessment.getVtbeQuestionIndex = function( ifr )
{
  var parents = ifr.ancestors();
  var num = parents.length;
  for ( var i = 0; i < num; i++ )
  {
    var parent = parents[ i ];
    if ( page.util.hasClassName( parent, 'takeQuestionDiv' ) )
    {
      var divid = parent.id;
      for ( var j = 0; j < assessment.questions_to_monitor_index; j++ )
      {
        if ( assessment.questions_to_monitor[ j ].qid == divid )
        {
          return j;
        }
      }
      return -1;
    }
  }
  return -1;

};

assessment.warnBeforeLeavingIfUnsavedOrUnsubmitted = function( isQbyQ, isForced, isSurvey )
{
  if ( ( isQbyQ && window.document.assessmentInternalNavigation ) || window.document.assessmentActuallySubmitted )
  {
    // don't warn if navigating inside a one at a time test as we will be saving automatically
    // or if the assessment is actually submitted in which case we hope they've saved all answers
    return;
  }
  var prefix = "test";
  if ( isSurvey )
  {
    prefix = "survey";
  }
  var timermsg = '';
  if ( typeof counter != 'undefined' && counter.timerRunning )
  {
    timermsg = page.bundle.getString( prefix + ".not.submitted.timer.running" );
  }

  if ( isForced )
  {
    return page.bundle.getString( prefix + ".not.submitted.forced.beforeunload.warning" );
  }
  return page.bundle.getString( prefix + ".not.submitted.beforeunload.warning" ) + timermsg;
};

/*
 * Send a warning message to the server to display to the user on the 'next' page they go to. Note that this message
 * will be XSSUtil.Filter'd to avoid XSS.
 */
assessment.queueUpWarning = function( msg, oneByOneAndForceUnload, isActivelyImpersonating )
{
  var url = assessment.getNextActionUrl() + '&method=queueUpWarning';

  if ( !!navigator.sendBeacon ) {
    var data = new FormData();
    data.append( 'msg', msg )
    data.append( 'oneByOneAndForceUnload' , oneByOneAndForceUnload );
    data.append( 'course_assessment_id' , document.forms.saveAttemptForm.course_assessment_id.value );
    data.append( 'isActivelyImpersonating' , isActivelyImpersonating );

    navigator.sendBeacon( url, data )
  } else {
    var params = Object.extend(
      {
        'msg' : msg,
        'oneByOneAndForceUnload' : oneByOneAndForceUnload,
        'course_assessment_id' : document.forms.saveAttemptForm.course_assessment_id.value,
        'isActivelyImpersonating' : isActivelyImpersonating
      } );
    var myAjax = new Ajax.Request( url,
      {
        method : 'post',
        parameters : params,
        asynchronous : false
      } );
  }

};

assessment.warnOnLeaveIfUnsavedOrUnsubmitted = function( isQbyQ, isForced, isSurvey, isActivelyImpersonating )
{
  if ( ( isQbyQ && window.document.assessmentInternalNavigation ) || window.document.assessmentActuallySubmitted )
  {
    // don't warn if navigating inside a one at a time test as we will be saving automatically
    // or if the assessment is actually submitted in which case we hope they've saved all answers
    return;
  }
  var timermsg = '';
  var prefix = "test";
  if ( isSurvey )
  {
    prefix = "survey";
  }
  if ( assessment.hasUnsavedAnswers() )
  {
    // Since we are always auto-saving anyways, we might as well just always save unsaved answers here.
    saveAllQuestions( false );
  }
  if ( isForced )
  {
    assessment.queueUpWarning( page.bundle.getString( prefix + ".not.submitted.forced.warning",
                                                      assessment.currentTestName ), true, isActivelyImpersonating );
  }
  else
  {
    if ( typeof counter != 'undefined' && counter.timerRunning )
    {
      timermsg = page.bundle.getString( prefix + ".not.submitted.timer.running" );
    }
    assessment.queueUpWarning( page.bundle.getString( prefix + ".not.submitted.warning", assessment.currentTestName ) +
                               timermsg, false, isActivelyImpersonating );
  }
};

assessment.setDefaultQuestionDisplay = function( blockToLeaveVisible )
{
  assessment.blockToLeaveVisible = blockToLeaveVisible;
  UserDataDWRFacade.getStringPermScope( "assessment.questionsExpanded", function( questionsExpanded )
  {
    if ( questionsExpanded == 'false' )
    {
      assessment.toggleQuestionDisplay();
    }
    assessment.blockToLeaveVisible = 'null';
  } );

};

assessment.setupChangeListener = function()
{
  // This loops over all input elements that have a name of "points_bulk"
  $$( 'input[name="points_bulk"]' ).each( function( elem )
  {

    Event.observe( elem, 'change', function( event )
    {
      assessment.updatePointsInput( event );
    } );
    Event.observe( elem, 'keyup', function( event )
    {
      assessment.updatePointsInput( event );
    } );
    Event.observe( elem, 'paste', function( event )
    {
      assessment.updatePointsInput( event );
    } );
  } );
};
assessment.toggleQuestionDisplay = function()
{
  var newVis = !assessment.questionVisibility;
  if ( newVis )
  {
    UserDataDWRFacade.setStringPermScope( "assessment.questionsExpanded", true );
  }
  else
  {
    UserDataDWRFacade.setStringPermScope( "assessment.questionsExpanded", false );
  }
  // Note -most of the time this will be "contentListItem:null" - that's OK
  var idToIgnore = "contentListItem:" + assessment.blockToLeaveVisible;
  $A( document.getElementsByTagName( 'li' ) )._each( function( entity )
  {
    // hide|show the given entity if it is one we care about
    var id = entity.id;
    if ( id.startsWith( "contentListItem:" ) && id != idToIgnore )
    {
      $A( entity.getElementsByTagName( 'div' ) )._each( function( adiv )
      {
        if ( page.util.hasClassName( adiv, 'details' ) )
        {
          if ( newVis )
          {
            $( adiv ).show();
          }
          else
          {
            $( adiv ).hide();
          }
        }
      } );
      if ( newVis )
      {
        entity.removeClassName( 'hideQuestionDetails' );
      }
      else
      {
        entity.addClassName( 'hideQuestionDetails' );
      }
    }
  } );
  var buttonText = page.bundle.getString( newVis ? "hide.question.details" : "show.question.details" );
  $( 'content_listContainer_hideshowQuestions_top' ).down( 'a' ).update( buttonText );
  $( 'content_listContainer_hideshowQuestions_bottom' ).down( 'a' ).update( buttonText );
  assessment.questionVisibility = newVis;
};

assessment.setDisableFlag = function( questionId, flag )
{
  assessment.modifyHelper( questionId, 'setDisableFlag' + flag, 'false' );
};

assessment.questionLabelMap =
{};
assessment.dndHooksAdded = false;

assessment.updateCorrectAnswerAltMessage = function()
{
  var index = 1;
  var questions = $( 'content_listContainer' );
  if ( questions )
  {
    $A( questions.childElements() ).each(
      function( li )
      {
        var questionNumberElement = li.select( "span.questionNumber.autoQuestionNumber" );
        if ( questionNumberElement && questionNumberElement.length == 1 )
        {
          var questionNumber = questionNumberElement[ 0 ].innerHTML.substring( 0, questionNumberElement[ 0 ].innerHTML.length - 1 )
          li.select( "img[name='correctAnswerImg']" ).each(
             function( elm )
             {
               var altMessage = elm.readAttribute( "alt" );
               elm.setAttribute( "alt", altMessage.replace( "##questionNumber##", questionNumber ) )
               var titleMessage = elm.readAttribute( "title" );
               if (titleMessage){
                 elm.setAttribute( "title", altMessage.replace( "##questionNumber##", questionNumber ) )
               }
             } )
        }

      } )
  }
}

assessment.setQuestionNumbers = function()
{
  var index = 1;
  // loop through line items in list of questions
  var questions = $( 'content_listContainer' );
  if ( questions )
  {
    $A( questions.childElements() ).each( function( li )
    {
      var h3 = li.down( 'h3' );
      var span = h3.down( 'span.questionNumber' );
      if ( !span ) // create & add span for questionNumber if none exists
      {
        span = new Element( 'span',
        {
          'class' : 'questionNumber autoQuestionNumber'
        } );
        h3.insert(
        {
          top : span
        } );
      }
      var id = h3.up( 'div' ).id;
      var qSetSize = $( 'questionCount' + id );
      var qNumStr = '' + index;
      if ( qSetSize ) // show number range for question sets
      {
        var s = parseInt( qSetSize.innerHTML, 10 );
        index += s - 1;
        if ( s > 1 )
        {
          qNumStr += ' - ' + index;
        }
        else if ( s === 0 )
        {
          qNumStr = '';
        }
      }
      qNumStr = qNumStr + '.';
      index++;
      span.update( qNumStr );
      // force JAWS reads number + label
      var checkbox = li.down( 'input' );
      var label = li.down( 'label' );
      checkbox.setAttribute('aria-label', qNumStr+' '+label.innerHTML);
      // Save numbered label in map for loading accessible reorder select.
      // Since the question labels render as literal text, replace all &nbsp; with space.
      assessment.questionLabelMap[ id ] = h3.innerHTML.stripTags().replace( /&nbsp;/g, " " );
    } );
  }
  if ( !assessment.dndHooksAdded )
  {
    var dndCtrl = dragdrop.getControllerObjById( 'pageListReorderControls' );
    if ( dndCtrl )
    {
      // Set question numbers in the accessible reorder select before opening it's popup.
      // Setting the question numbers needs to be defered until the popup is added to the DOM, which
      // happens just before the popup is opened
      dndCtrl.extPreOpenCallback = assessment.setAccessibleReorderQuestionNumbers;
      // call this function to set question numbers after a dnd or accessible reorder happens
      dndCtrl.extPostOrderCallback = assessment.setQuestionNumbers;
      assessment.dndHooksAdded = true;
    }
  }
};

assessment.setAccessibleReorderQuestionNumbers = function()
{
  $A( $( 'pageListReorderControlSelect' ).options ).each( function( option )
  {
    option.text = assessment.questionLabelMap[ option.value ];
  } );
};

assessment.viewReferencingCanvases = function( courseId, assessmentId )
{
  var url = "/webapps/assessment/do/authoring/modifyAssessment?course_id=" + courseId +
            "&method=getReferringCanvases&assessmentId=" + assessmentId;
  new Ajax.Request( url,
  {
      method : 'post',
      asynchronous : false,
      onCreate : function()
      {
        document.body.style.cursor = 'progress';
      },
      onComplete : function( req )
      {
        document.body.style.cursor = 'default';
      },
      onSuccess : function( req )
      {
        $( 'referencingCanvasesPlaceholder' ).update( req.responseText );
      },
      onFailure : function( req )
      {
        $( 'referencingCanvasesPlaceholder' ).update( page.bundle.getString( "error.loading.referrers" ) );
      }
  } );
};

assessment.normalizedWidth = 0;
assessment.setNormalizedButtonWidth = function( myButton )
{
  if ( assessment.normalizedWidth === 0 )
  {
    myButton.value = page.bundle.getString( 'takeSaveAnswer' );
    Element.removeClassName( myButton, 'answerSavingButton' );
    Element.removeClassName( myButton, 'answerSavedButton' );
    assessment.normalizedWidth = myButton.clientWidth;

    myButton.value = page.bundle.getString( 'takeSaveAnswerAgain' );
    Element.addClassName( myButton, 'answerSavedButton' );
    if ( myButton.clientWidth > assessment.normalizedWidth )
    {
      assessment.normalizedWidth = myButton.clientWidth;
    }
    myButton.value = page.bundle.getString( 'savingAnswer' );
    Element.addClassName( myButton, 'answerSavingButton' );
    Element.removeClassName( myButton, 'answerSavedButton' );
    if ( myButton.clientWidth > assessment.normalizedWidth )
    {
      assessment.normalizedWidth = myButton.clientWidth;
    }
  }
  // myButton.style.width = assessment.normalizedWidth + 'px';
  return;
};

assessment.resetFields = function()
{
  window.document.assessmentSubmitted = false;
  window.document.assessmentActuallySubmitted = true;
};

assessment.getNextActionUrl = function()
{
  var url = document.forms.saveAttemptForm.action;
  url = url + '?saveSequence=' + ( assessment.saveSequence++ ) + '&takePageId=' + assessment.takePageId;

  // Add query parameters needed to regenerate the launch page if needed. This is to handle the edge case where
  // a student tries to save their question, happens to lose their network connection for that second. In that scenario,
  // he would see an internal browser error page. If he hits 'enter' on the browser location bar and happens to get back
  // his network connection, that will generate a GET
  // to the LEARN Server. To try to recover from the network error, LEARN will use the following query parameters to
  // send them back to the take page.
  // Note, this won't work for Assessments using 'forceCompletion'.
  url = url + '&course_assessment_id=' + document.forms.saveAttemptForm.course_assessment_id.value;
  url = url + '&course_id=' + document.forms.saveAttemptForm.course_id.value;
  url = url + '&content_id=' + document.forms.saveAttemptForm.content_id.value;
  return url;
};

assessment.submitAttemptForm = function()
{
  var myForm = document.forms.saveAttemptForm;
  var origUrl = myForm.action;
  myForm.action = assessment.getNextActionUrl();
  try
  {
    myForm.submit();
  }
  catch ( err )
  {
    // Make sure we get to the next line and reset the url just in case.
  }
  myForm.action = origUrl;
  // For submits on tests with file-upload questions, we have to be able to submit the form again.
  // For other uses of this method, we're reloading the page and dealing with double-submit in our own
  // assessment-specific fashion so we want to disable the default doublesubmit handling.
  doubleSubmit.allowSubmitAgainForForm( myForm );
};

// This is the final save-and-submit request for the test/survey
assessment.doConfirmSubmit = function( msg )
{
  document.forms.saveAttemptForm.save_and_submit.value = 'true';
  try
  {
    if ( confirmSubmit( msg ) )
    {
      assessment.resetFields();
      assessment.submitAttemptForm();
    }
  }
  catch ( err )
  {
    // If we had an error, continue to clear the saveandsubmit value
  }
  document.forms.saveAttemptForm.save_and_submit.value = '';
  return false;
};

assessment.alertSaveStatus = function( status, forSaveAll )
{
  if ( status == 'COMPLETED' )
  {
    // status == 'COMPLETED' we will not show an alert on successful save, button change to 'Saved' is already indicator
    // of successful save for individual questions
    if ( forSaveAll )
    {
      alert( page.bundle.getString( "confirm.saved_all" ) );
    }
  }
  else if ( status == 'PARTIAL' )
  {
    alert( page.bundle.getString( "confirm.saved_partial" ) );
  }
  else if ( status == 'UNANSWERED' )
  {
    alert( page.bundle.getString( "confirm.saved_empty" ) );
  }
  else
  {
    alert( page.bundle.getString( "confirm.error" + ( forSaveAll ? "_all" : "" ) ) );
  }
};

// The following safetynet method is used to give the student a chance to 'resubmit' if they are afraid
// the system has "lost" their request. In reality this shouldn't happen, but in cases where a server node
// crashes or is killed while saving or the rarer case where a firewall or other network device "swallows" the
// connection
// this will at least enable the buttons in the UI so the student can try again.
assessment.checkAlreadySavedSafetyNet = function()
{
  assessment.alreadySavedSafetyNetId = null;
  if ( !window.document.assessmentSaved )
  {
    // Since the already-saved check can be done on either a page reload or on an inline save, the
    // safety net is not going to always "go away" because there is no page reload. Instead, merely
    // check the status of this flag and silently return if it has been cleared.
    return;
  }
  if ( doesUserWantToRiskItAndTryOver()  )
  {
    window.document.assessmentSaved = false;
  }
  else
  {
    assessment.checkAlreadySavedSafetyNet.delay( assessment.safetyNetDelay );
  }
};

assessment.checkAlreadySaved = function( msg )
{
  var valid = assessment.prepareForSubmit( true );
  if ( window.document.assessmentSaved === true )
  {
    alert( msg );
    return false;
  }
  if ( assessment.alreadySavedSafetyNetId !== null )
  {
    window.clearTimeout( assessment.alreadySavedSafetyNetId );
  }
  assessment.alreadySavedSafetyNetId = assessment.checkAlreadySavedSafetyNet.delay( assessment.safetyNetDelay );
  window.document.assessmentSaved = true;
  return true;
};

assessment.removeFileUploadAnswer = function( fieldName, divName, questionId, questionNumber, remAnsSuffix,
                                              takeDupeSaveMsg )
{
  document.getElementById( divName ).style.display = "none";
  document.forms.saveAttemptForm.elements.method.value = "fileremove";
  document.forms.saveAttemptForm.elements[ fieldName + '-override' ].value = "false";
  document.forms.saveAttemptForm.elements[ fieldName + remAnsSuffix ].value = "true";
  try
  {
    if ( assessment.checkAlreadySaved( takeDupeSaveMsg ) )
    {
      saveOneItem( questionId, questionNumber, true, false );
    }
  }
  catch ( err )
  {
    // Ignore - just want to make sure we do the next statement
  }
  document.forms.saveAttemptForm.elements[ fieldName + remAnsSuffix ].value = "";
  return false;
};

assessment.updateQuestionStatusResponse = function( originalRequest )
{
  var qnums = originalRequest.responseText;
  var lines = qnums.split( "\n" );
  var qnum = lines[ 0 ].split( "," );
  for ( var i = 0; i < qnum.length; i++ )
  {
    var num = qnum[ i ];
    if ( num > 0 )
    {
      setSavedIcon( num );
    }
    else
    {
      setNotSavedIcon( -num, true );
    }
  }
  for ( var j = 1; j < lines.length; j++ )
  {
    var fileUpload = lines[ j ].split( ":" );
    if ( fileUpload.length == 2 )
    {
      var divName = "file_upload_div_" + fileUpload[ 0 ];
      var divElement = document.getElementById( divName );
      if ( fileUpload[ 1 ] == "HIDE" )
      {
        if ( divElement !== null )
        {
          divElement.style.display = "none";
        }
      }
      else
      {
        var spanName = "file_upload_span_" + fileUpload[ 0 ];
        var cancelFileButton = "file_upload_ans_" + fileUpload[ 0 ] + "_cancelFileButton";
        var cancelElement = document.getElementById( cancelFileButton );
        var overrideName = "file_upload_ans_" + fileUpload[ 0 ] + "-override";
        var overrideElement = document.forms.saveAttemptForm.elements[ overrideName ];
        var spanElement = document.getElementById( spanName );
        if ( divElement !== null ) // we must check if item exists for one question at a time format
        {
          divElement.style.display = "block";
        }
        if ( spanElement !== null )
        {
          spanElement.innerHTML = fileUpload[ 1 ];
        }
        if ( cancelElement !== null )
        {
          cancelElement.click();
        }
        if ( typeof overrideElement !== 'undefined' && overrideElement !== null )
        {
          overrideElement.value = "true";
        }
      }
    }
  }
};

assessment.prepareForSubmit = function( doValidation )
{
  // MUST VALIDATE FORM TO PERSIST WYSIWYG
  // Set textarea value to VTBE contents:
  if ( typeof ( finalizeEditors ) == "function" )
  {
    finalizeEditors();
  }

  /* Transform equations place holders into html before validation */
  var ismath = window.api ? true : false; // True if webeq is there

  /* Transform equations place holders into html before validation */
  if ( ismath )
  {
    api.setHtml();
  }

  if ( doValidation )
  {
    /* Validate form TODO: Why not call validateForm() */
    var valid = formCheckList.check();
    return valid;
  }
  return true;
};

assessment.inlineJumpTo = function( questionNumber )
{
  var elem = $( questionNumber );
  elem.removeClassName( 'hidden' );
  elem.focus();
  var mytop = elem.cumulativeOffset()[ 1 ];
  var scrollleft = document.viewport.getScrollOffsets().left;
  var statusHeight = $( 'topbar' ).getDimensions().height + 30;
  window.scrollTo( scrollleft, mytop - statusHeight );
  elem.addClassName( 'hidden' );
  return false;
};

assessment.getQuestionItemResponseSilent = function( originalRequest )
{
  assessment.getQuestionItemResponseHelper( originalRequest, false );
};

assessment.getQuestionItemResponse = function( originalRequest )
{
  assessment.getQuestionItemResponseHelper( originalRequest, true );
};

assessment.getQuestionItemResponseHelper = function( originalRequest, interactive )
{
  var reqStatus = originalRequest.status;
  var status = assessment.parseAjaxResponse( originalRequest );
  assessment.setQuestionStatus( status == "COMPLETED", (reqStatus != 0) );
  assessment.savingRightNow = false;
  if ( interactive )
  {
    assessment.alertSaveStatus( status, false );
  }
};

assessment.onFailureCallBackSilent = function( failure )
{
  assessment.onFailureCallBackHelper( failure, false );
};

assessment.onFailureCallBack = function( failure )
{
  assessment.onFailureCallBackHelper( failure, true );
};

assessment.onFailureCallBackHelper = function( failure, interactive )
{
  try
  {
    if ( failure && failure.responseText )
    {
      var error = failure.responseText.split( '##' )[ 0 ];
      if ( interactive )
      {
        alert( page.bundle.getString( "confirm.error" ) + ": " + error );
      }
    }
    // First, immediately set the status to false for the question we just failed on - then do a full update of all
    // status.
    assessment.setQuestionStatus( false, false );
    updateQuestionStatus();
  }
  catch ( err )
  {
    // Ignoring - just want to make sure we hit the next two lines of code all the time
  }
  assessment.savingRightNow = false;
  window.document.assessmentSaved = false;
};

assessment.onExceptionCallBackSilent = function( failure )
{
  assessment.onExceptionCallBackHelper( failure, false );
};

assessment.onExceptionCallBack = function( failure )
{
  assessment.onExceptionCallBackHelper( failure, true );
};

assessment.onExceptionCallBackHelper = function( failure, interactive )
{
  assessment.onFailureCallBackHelper( failure, interactive );
};

assessment.setQuestionStatus = function( isSave, isSuccess )
{
  var questionNum = document.forms[ 'saveAttemptForm' ].current_question.value
  if ( isSave )
  {
    setSavedIcon( questionNum );
  }
  else
  {
    setNotSavedIcon( questionNum, isSuccess );
    if ( !isSuccess )
    {
      // Called as a result of a failure/exception in the ajax call - set the savestatus to FAILED_SAVE
      // so that we will try to auto-save again (and to avoid having questionstatus think it is actually saved)
      assessment.markQuestionSaveStatus( questionNum, assessment.questionStatus.FAILED_SAVE );
    }
  }
  window.document.assessmentSaved = false;
};

assessment.AIMcompleteCallbackSilent = function( response )
{
  return assessment.AIMcompleteCallbackHelper( response, false, false );
};

assessment.AIMcompleteCallback = function( response )
{
  return assessment.AIMcompleteCallbackHelper( response, true, false );
};

assessment.AIMcompleteSaveAllCallback = function( response )
{
  return assessment.AIMcompleteCallbackHelper( response, true, true );
};

assessment.AIMcompleteCallbackHelper = function( response, interactive, forSaveAll )
{
  document.forms[ 'saveAttemptForm' ].target = "";
  var status = 'ERROR';
  try
  {
    if ( response )
    {
      // AIM-posted responses will be wrapped in a pre html block...
      response = response.replace( /<pre[^>.]*>/i, '' ).replace( /<\/pre>/, '' );
    }
    status = assessment.parseAjaxResponseEx( response );
    updateQuestionStatus();
  }
  catch ( err )
  {
    // Ignoring - just want to make sure we hit the next line of code all the time
  }
  assessment.savingRightNow = false;
  try
  {
    if ( interactive )
    {
      assessment.alertSaveStatus( status, forSaveAll );
    }
    assessment.setQuestionStatus( status == "COMPLETED", status != "ERROR" );
    if ( status != 'COMPLETED' && status != 'UNANSWERED' )
    {
      var qId = assessment.getQuestionIdFromNumber( assessment.questionBeingSaved );
      if ( qId )
      {
        assessment.hideShowFileActionsIfRequired( qId, false );
      }
    }
  }
  catch ( err )
  {
    // Ignoring - just want to make sure we hit the next two lines of code all the time
  }
  window.document.assessmentSaved = false;
  return;
};

function setSavedIcon( questionNum )
{
  if ( assessment.getQuestionStatus( questionNum ) == assessment.questionStatus.FAILED_SAVE )
  {
    //
    return;
  }
  var mySpan = document.getElementById( "span_" + questionNum );
  var myImg = document.getElementById( "img_" + questionNum );
  var myButton = assessment.getSaveButton( questionNum );

  mySpan.className = "qComplete";
  myImg.src = "/images/ci/icons/file_li.gif";
  myImg.alt = page.bundle.getString( "qStatus.complete" );
  myImg.height = "10";
  myImg.width = "10";
  if ( assessment.questionBeingSaved != -1 && questionNum != assessment.questionBeingSaved )
  {
    // Do not update the status to saved for a question if we were not just saving it.
    return;
  }
  if ( myButton )
  {
    assessment.setNormalizedButtonWidth( myButton );
    myButton.value = page.bundle.getString( "take.save_answer.again" );
    Element.removeClassName( myButton, 'answerSavingButton' );
    Element.removeClassName( myButton, 'answerSaveFailed' );
    Element.addClassName( myButton, 'answerSavedButton' );
    assessment.failedSaveCount = 0;
  }
  assessment.markQuestionAsSaved( questionNum );
}

function setNotSavedIcon( questionNum, isSuccess )
{
  var mySpan = document.getElementById( "span_" + questionNum );
  var myImg = document.getElementById( "img_" + questionNum );
  var myButton = assessment.getSaveButton( questionNum );

  mySpan.className = "qIncomplete";
  myImg.src = "/images/spacer.gif";
  myImg.alt = page.bundle.getString( "qStatus.incomplete" );
  myImg.height = "1";
  myImg.width = "1";
  if ( myButton )
  {
    assessment.setNormalizedButtonWidth( myButton );
    Element.removeClassName( myButton, 'answerSavingButton' );
    Element.removeClassName( myButton, 'answerSavedButton' );
    if (isSuccess)
    {
      myButton.value = page.bundle.getString( "take.save_answer" );
      Element.removeClassName( myButton, 'answerSaveFailed' );
      assessment.failedSaveCount = 0;
    }
    else
    {
      myButton.value = page.bundle.getString( "take.save_answer.failed" );
      Element.addClassName( myButton, 'answerSaveFailed' );
      assessment.failedSaveCount++;
      if (assessment.failedSaveCount >= assessment.SAVE_ATTEMPTS_BETWEEN_NOTIFICATION)
      {
        assessment.failedSaveCount = 0;
        alert(page.bundle.getString('continuous.save.failures'))
      }
    }
  }
}

function AIMstartCallbackSilent()
{
  return true;
}
function AIMstartCallback()
{
  return true;
}

function doesUserWantToRiskItAndTryOver()
{
  var key = assessment.backtrackProhibited ? 'warning.taking.too.long.nobacktracking' : 'warning.taking.too.long';
  return window.confirm( page.bundle.getString( key ) );
}

// The following safetynet methods are used to give the student a chance to 'resubmit' if they are afraid
// the system has "lost" their request. In reality this shouldn't happen, but in cases where a server node
// crashes or is killed while saving or the rarer case where a firewall or other network device "swallows" the
// connection
// this will at least enable the buttons in the UI so the student can try again.
function checkAlreadySubmittedSafetyNet()
{
  if ( doesUserWantToRiskItAndTryOver() )
  {
    window.document.assessmentSubmitted = false;
    assessment.submittingRightNow = false;
  }
  else
  {
    checkAlreadySubmittedSafetyNet.delay( assessment.safetyNetDelay );
  }
}

function internalNavigationSafetyNet()
{
  if ( doesUserWantToRiskItAndTryOver()  )
  {
    window.document.assessmentInternalNavigation = false;
  }
  else
  {
    internalNavigationSafetyNet.delay( assessment.safetyNetDelay );
  }
}

assessment.parseAjaxResponse = function( originalRequest )
{
  var response = originalRequest.responseText;
  return assessment.parseAjaxResponseEx( response );
};

assessment.parseAjaxResponseEx = function( response )
{
  var status = 'ERROR';
  if ( typeof ( response ) != 'undefined' && response !== '' )
  {
    var parts = response.split( ',' );
    status = parts[ 0 ];
    var statusParts = status.split( '>' );
    if ( statusParts.length > 1 )
    {
      status = statusParts[ 1 ];
    }
    if ( parts.length > 1 )
    {
      var elapsed = parts[ 1 ].split( '<' )[ 0 ];
      if ( status != 'COMPLETED' && status != 'UNANSWERED' && status != 'PARTIAL' )
      {
        status = 'ERROR';
      }
      if ( elapsed != -1 )
      {
        if ( window[ 'counter' ] )
        {
          fixClock( elapsed );
        }
      }
    }
  }
  return status;
}

function saveQuestionItem( questionNum, asyncSave, interactive )
{
  var url = assessment.getNextActionUrl();
  document.forms[ 'saveAttemptForm' ].elements[ 'saveonequestion' ].value = "true";
  var myAjax = new Ajax.Request( url,
  {
      method : 'post',
      parameters : Form.serialize( document.forms[ 'saveAttemptForm' ] ),
      onSuccess : interactive ? assessment.getQuestionItemResponse : assessment.getQuestionItemResponseSilent,
      onFailure : interactive ? assessment.onFailureCallBack : assessment.onFailureCallBackSilent,
      onException : interactive ? assessment.onExceptionCallBack : assessment.onExceptionCallBackSilent,
      asynchronous : asyncSave
  } );
}

assessment.saveAllQuestionsResponse = function( originalRequest )
{
  try
  {
    var status = assessment.parseAjaxResponse( originalRequest );
    if ( status == 'COMPLETED' ) //have to do this here because the alert is modal and freezes the UI.
    {
      for( var i = 0; i < assessment.questions_to_monitor_index; i++ )
      {
        assessment.questionBeingSaved = assessment.questions_to_monitor[i].qnum;
        setSavedIcon( assessment.questionBeingSaved );
      }
    }
    assessment.alertSaveStatus( status, true );
  }
  catch ( err )
  {
    // Ignoring - just want to make sure we hit the rest of this method
  }
  try
  {
    // value of -1 indicates saving all questions
    // after it was changed above, we need to reset it here, before calling updateQuestionStatus(),
    // which otherwise would not reset the save-all button text.
    assessment.questionBeingSaved = -1;
    updateQuestionStatus();
  }
  catch ( err )
  {
    // Ignoring - just want to make sure we hit the next two lines of code all the time
  }
  assessment.savingRightNow = false;
  window.document.assessmentSaved = false;
};

function getDisplayPreference( element )
{
  if ( element == "statusBlock" )
  {
    getStatusDisplay(ClientCache.getItem(element));
  }
  else
  {
    getInstructionDisplay(ClientCache.getItem(element));
  }
}

function getStatusDisplay( response )
{
  if ( response == "inline" )
  {
    showElement( 'statusBlock' );
  }
  else
  {
    hideElement( 'statusBlock' );
  }
}

function setFileUploadType( param )
{
  document.forms[ 'saveAttemptForm' ].elements[ 'fileUploadType' ].value = param;
}

function isFileUploadType()
{
  if ( document.forms[ 'saveAttemptForm' ].elements[ 'fileUploadType' ].value == 'true' )
  {
    return true;
  }
  else
  {
    return false;
  }
}
function getInstructionDisplay( response )
{
  if ( response == "none" )
  {
    var msgspan = "instructionsText";
    var msgimg = msgspan + "img";
    document.getElementById( msgspan ).style.display = "none";
    document.images[ msgimg ].src = "/images/ci/ng/more_options_dark.gif";
    document.images[ msgimg ].title = ""; // TODO: This text was lost a while ago... what should it be?
    document.images[ msgimg ].alt = ""; // ditto
  }
}

function updateQuestionStatus()
{
  // Reset the save-all button text if we're saving all the questions
  if ( assessment.questionBeingSaved == -1 )
  {
    var topSaveAllButton = document.getElementById( "top_saveAllAnswersButton" );
    var bottomSaveAllButton = document.getElementById( "bottom_saveAllAnswersButton" );
    if ( topSaveAllButton )
    {
      topSaveAllButton.value = page.bundle.getString( 'take.save_continue' );
    }
    if ( bottomSaveAllButton )
    {
      bottomSaveAllButton.value = page.bundle.getString( 'take.save_continue' );
    }
  }

  var url = assessment.getNextActionUrl();
  // no xsrf check required for updating status
  document.forms.saveAttemptForm.elements[ 'method' ].value = 'reloadQS';
  var parms = Form.serialize( document.forms[ 'saveAttemptForm' ] );
  document.forms.saveAttemptForm.elements[ 'method' ].value = '';
  var myAjax = new Ajax.Request( url,
  {
      method : 'post',
      parameters : parms,
      onComplete : assessment.updateQuestionStatusResponse
  } );
}

assessment.onQueryTimeRemainingSuccess = function( originalRequest )
{
    var response = originalRequest.responseText;
	var obj = JSON.parse( response );

	return obj.timeRemainingInMS || 0;
}

assessment.queryRemainingTimeInMS = function()
{
	var url = assessment.getNextActionUrl();
	document.forms.saveAttemptForm.elements[ 'method' ].value = 'queryTimeRemainingMs';
	var parms = Form.serialize( document.forms[ 'saveAttemptForm' ] );
	document.forms.saveAttemptForm.elements[ 'method' ].value = '';

	var deferred = new $j.Deferred();

	var myAjax = new Ajax.Request( url,
	{
		method : 'post',
		parameters : parms,
		onComplete : function ( data ) {
				    	     deferred.resolve( assessment.onQueryTimeRemainingSuccess( data ) );
				      }

	} );

	return deferred.promise();
}

function saveAllQuestions( asyncSave )
{
  assessment.prepareForSubmit( false );

  var topSaveAllButton = document.getElementById( "top_saveAllAnswersButton" );
  var bottomSaveAllButton = document.getElementById( "bottom_saveAllAnswersButton" );
  if ( topSaveAllButton )
  {
    topSaveAllButton.value = page.bundle.getString( 'take.save_continue.saving' );
  }
  if ( bottomSaveAllButton )
  {
    bottomSaveAllButton.value = page.bundle.getString( 'take.save_continue.saving' );
  }
  assessment.questionBeingSaved = -1; // saving all questions
  if ( !isFileUploadType() )
  {
    assessment.savingRightNow = true; // cleared in callback methods
    var url = assessment.getNextActionUrl();
    document.forms.saveAttemptForm.elements[ 'method' ].value = 'saveAllAnswers';
    var parms = Form.serialize( document.forms[ 'saveAttemptForm' ] );
    document.forms.saveAttemptForm.elements[ 'method' ].value = '';
    var myAjax = new Ajax.Request( url,
    {
        method : 'post',
        parameters : parms,
        onSuccess : assessment.saveAllQuestionsResponse,
        onFailure : assessment.onFailureCallBack,
        onException : assessment.onExceptionCallBack,
        asynchronous : asyncSave
    } );
  }
  else
  {
    if ( !asyncSave )
    {
      // At this point we are in the page unload logic and have to perform synchronous saves.
      // We only want to save questions that have changed, and even at that, cannot save the
      // file-upload questions as they rely on the ability to create new iframes on the current
      // document which does not work in an onunload handler
      var num_unsaved_upload_files = 0;
      for ( var i = 0; i < assessment.questions_to_monitor_index; i++ )
      {
        if ( assessment.questions_to_monitor[ i ].status == assessment.questionStatus.MODIFIED )
        {
          if ( assessment.questions_to_monitor[ i ].isFileUploadQuestion )
          {
            num_unsaved_upload_files++;
          }
          else
          {
            saveOneItem( assessment.questions_to_monitor[ i ].qid, assessment.questions_to_monitor[ i ].qnum,
                         asyncSave, false );
          }
        }
      }
      if ( num_unsaved_upload_files > 0 )
      {
        assessment.queueUpWarning( page.bundle.getString( "question.file_upload.unsaved_warning",
                                                          assessment.currentTestName, num_unsaved_upload_files ) );
      }
    }
    else
    {
      assessment.savingRightNow = true; // cleared in callback methods
      var theSaveForm = document.forms.saveAttemptForm;
      theSaveForm.elements[ 'method' ].value = 'saveAllAnswers';
      AIM.submit( theSaveForm,
      {
          'onStart' : AIMstartCallback,
          'onComplete' : assessment.AIMcompleteSaveAllCallback
      } );
      assessment.submitAttemptForm();
      theSaveForm.elements[ 'method' ].value = '';
      theSaveForm.target = ""; // Do not wait for the callback to change the target - clear it now so navigation will
                                // still work
    }
  }
}
assessment.getQuestionIdFromNumber = function( qnum )
{
  for ( var i = 0; i < assessment.questions_to_monitor_index; i++ )
  {
    if ( assessment.questions_to_monitor[ i ].qnum == qnum )
    {
      return assessment.questions_to_monitor[ i ].qid;
    }
  }
  return undefined;
};


function saveOneItem( questionId, questionNumber, asyncSave, interactive )
{
  if ( assessment.submittingRightNow )
  {
    // Ignore if submitting right now
    return;
  }
  var myButton = assessment.getSaveButton( questionNumber );

  assessment.prepareForSubmit( false );
  document.forms[ 'saveAttemptForm' ].current_question.value = questionNumber;
  if ( !assessment.isOneByOne )
  {
    document.forms[ 'saveAttemptForm' ].current_attempt_item_id.value = questionId;
  }

  var theSaveForm = document.forms[ 'saveAttemptForm' ];

  // No user interaction when the user leave the page (asyncSave == false)
  if ( !asyncSave || !interactive || assessment.checkAlreadySaved( page.bundle.getString( 'take.dupe_save' ) ) )
  {
    if ( myButton )
    {
      myButton.value = page.bundle.getString( 'take.saving_answer' );
      Element.removeClassName( myButton, 'answerSaveFailed' );
      Element.addClassName( myButton, 'answerSavingButton' );
      Element.removeClassName( myButton, 'answerSavedButton' );
    }
    assessment.savingRightNow = true; // cleared in callback methods
    theSaveForm.elements[ 'method' ].value = 'saveQuestion';
    /*
     * we are reusing the same window, but the assessmentSaved attribute does not get reset on the main page until after
     * this save is finished processing, so there can be no double submit
     */
    // Save the question via ajax
    assessment.questionBeingSaved = questionNumber;
    if ( !isFileUploadType() || !asyncSave )
    {
      saveQuestionItem( questionNumber, asyncSave, interactive );
    }
    else
    {
      assessment.hideShowFileActionsIfRequired( questionId, true );
      theSaveForm.elements[ 'saveonequestion' ].value = "true";
      AIM.submit( theSaveForm,
      {
          'onStart' : AIMstartCallbackSilent, // Always silent on start - don't want to display the red saving answer
                                              // for single questions
          'onComplete' : interactive ? assessment.AIMcompleteCallback : assessment.AIMcompleteCallbackSilent
      } )
      assessment.submitAttemptForm();
      theSaveForm.target = ""; // Do not wait for the callback to change the target - clear it now so navigation will
                                // still work
      assessment.remonitorFileUpload( questionId, questionNumber );
    }
  }

  theSaveForm.elements[ 'method' ].value = '';
  theSaveForm.current_attempt_item_id.value = theSaveForm.current_attempt_item_id_backup.value;
}

assessment.hideShowFileActionsIfRequired = function( questionId, hide )
{
  var fieldName = 'file_upload_ans_' + questionId + '_selectedFileActions';
  var selectedFileActions = $( fieldName );
  if ( selectedFileActions )
  {
    if ( hide )
    {
      assessment.hasUnsavedAnswers(); // In case we clicked to add a file AND then clicked to remove an existing file
                                      // before saving the add-file - this will force a save of the added file after
                                      // removing the old one
      selectedFileActions.hide();
    }
    else
    {
      selectedFileActions.show();
    }
  }
};

assessment.checkAlreadySubmitted = function( msg )
{
  if ( typeof ( finalizeEditors ) == "function" )
  {
    finalizeEditors();
  }
  if ( window.document.assessmentSubmitted == true )
  {
    alert( msg );
    return false;
  }
  checkAlreadySubmittedSafetyNet.delay( assessment.safetyNetDelay );
  window.document.assessmentSubmitted = true;
  return true;
};

assessment.ensureVisible = function ( scrollId )
{

  if (scrollId.startsWith("position_")) // See ModifyQuestionAction.SCROLL_POSITION_PREFIX
  {
    scrollId = scrollId.substring(9);
    // loop through line items in list of questions
    var questions = $( 'content_listContainer' );
    if ( questions )
    {
      var allQuestions = questions.childElements();
      if (scrollId >= allQuestions.length)
      {
        scrollId = allQuestions.length;
      }
      scrollId -= 1;
      var qq = allQuestions[ scrollId ];
      if ( qq )
      {
        var bid = qq.id.replace( 'contentListItem:', 'blockstart_' );
        page.util.ensureVisible( $( bid ) );
      }
    }
  }
  else
  {
    page.util.ensureVisible($(scrollId));
  }
};

/**
 * Init code to make multiple choice questions toggable (e.g. click on to
 * select, click again to deselect).
 */
assessment.initToggableMultipleChoiceRadioButtons = function()
{
  // Get all multiple choice radio buttons on the page.
  var radioButtons = $j("input:radio.multiple-choice-question");

  // For each one, add a data attribute to remember whether it was on or off.
  $j.each(radioButtons, function(index, value) {
	  $j(value).data('waschecked',  value.checked );
  } );

  // Add togglable behavior to each radio button's onClick
  radioButtons.on("click", function() {
    var selectedRadio = $j(this);

    // Going from checked to unchecked
    if (selectedRadio.data('waschecked') == true) {
      selectedRadio.prop('checked', false);
      selectedRadio.data('waschecked', false);
    } else {
      // Going from unchecked to checked
      selectedRadio.data('waschecked', true);
    }

    // Need to manually send out a 'change' event to change the question's saved
	// state to unsaved. See above's assessment.QMonitor.prototype() function.
    var theChangeEvent = null;
    if ( typeof(Event) === 'function' ) {
      theChangeEvent = new Event('change');
    }
    else
    {
      // MSIE 11 does not support the Event constructor taking in a name.
      theChangeEvent = document.createEvent('Event');
      // Event.initEvent() is a deprecated function but we need it for MSIE 11. to programatically
      // dispatch a change event.
      theChangeEvent.initEvent('change', true, true);
    }

    this.dispatchEvent(theChangeEvent);

    // remove 'waschecked' from other radio buttons in the radio group.
    var radioName = selectedRadio.attr('name');
    $j("input:radio[name='" + radioName + "']").each(function(i, value ) {
       if ( selectedRadio.attr('id') !== value.id ) {
         $j(value).data('waschecked', false);
       }
    });

  });
};
