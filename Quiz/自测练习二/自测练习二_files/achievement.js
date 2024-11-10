/**
 * Handle the display of all the given achievements
 *
 * @param achJsonArray The array of Achievements to handle
 */
function handleAchievements( achJsonArray )
{

  if ( achJsonArray === undefined || achJsonArray.length < 1 )
    return;

  Effect.Notify = function( element )
  {
    element = $( element );
    return new Effect.Appear( element,
    {
      afterFinishInternal : function( effect )
      {
        new Effect.Fade( effect.element,
        {
          delay : 8.0
        } );
      }
    } );
  };

  var message = '';

  if ( achJsonArray.length == 1 )
    message = achJsonArray[ 0 ].newAchMsg;
  else
    message = achJsonArray[ 0 ].newAchMsgs;

  var insertionPoint = $( 'breadcrumbs' );
  var pageWidth = insertionPoint.getWidth();
  var clickTarget = window.location.protocol + '//' + window.location.host + '/webapps/achievements/studentViewAchievements.form?course_id=' + achJsonArray[ 0 ].courseId;
  var divWidth = Math.floor( pageWidth / 3 );
  if ( divWidth > 500 )
    divWidth = 500;
  var position = Math.floor( ( pageWidth / 2 ) - ( divWidth / 2 ) );
  //Div within an <a> tag is now valid: http://dev.w3.org/html5/markup/a.html#a-changes
  var notDiv = '<a href="' + clickTarget + '">' +
                 '<div id="achNotificationDiv" style="display:none; ' + //display:none CANNOT move to CSS file for Scriptaculous effects to work
                   'width: ' + divWidth +'px;  ' +
                   'left: ' + position + 'px; ">' +
                   '<div>' + message + '</div>' +
                 '</div>' +
               '</a>';

  insertionPoint.insert(
  {
    before : notDiv
  } );
  new Effect.Notify( 'achNotificationDiv' );
}

function changeAchCardFilter( selectedFilter ) {

  var selectedSpan = $(selectedFilter);

  $$('.selectedFilter').invoke('removeClassName', 'selectedFilter');
  selectedSpan.addClassName('selectedFilter');

  if ( selectedFilter === 'allSpan' ) {
    $$('div.achievementCardDiv.achievementCardEarned').invoke('appear');
    $$('div.achievementCardDiv.achievementCardUnearned').invoke('appear', {from: 0, to: 0.5});
  } else if ( selectedFilter === 'earnedSpan' ) {
    $$('div.achievementCardDiv.achievementCardUnearned').invoke('fade', {from: 0.5, to: 0});
    $$('div.achievementCardDiv.achievementCardEarned').invoke('appear');
  } else if ( selectedFilter === 'unearnedSpan' ) {
    $$('div.achievementCardDiv.achievementCardEarned').invoke('fade');
    $$('div.achievementCardDiv.achievementCardUnearned').invoke('appear', {from: 0, to: 0.5});
  }
  return false;
}

function printCertificate( certKey, courseId, achId ) {
	var url = 'previewCertificate.do?course_id=' + courseId + '&cert_key=' + certKey + '&action=print';
	if (achId !== null || achId !== undefined) {
		url = 'previewCertificate.do?course_id=' + courseId + '&ach_id=' + achId + '&cert_key=' + certKey + '&action=print';
	}

  remote = window.open(url, 'print_certificate', 'height=600px,width=800px');
  return false;
}

function amILoaded() {
  return true;
}

//Copy-paste from bb-alerts/js/nautilus_stream.js
function onDismissEvent( event, actorIdStr, providerId, sequenceId )
{
  var e = event || window.event; // IE does not capture the event
  if( e && e.type == 'click')
  {
    Event.stop(e);
  }
  NautilusViewService.removeRecipient( actorIdStr, {
     errorHandler: function() {
       // TODO: Get a better message
       alert("Error removing notification! " );
     },
     callback: function(item) {
       //let model remove
       stream.removeSingleEntry( "alerts", providerId + sequenceId );
     }.bind(this) });
  page.ContextMenu.closeAllContextMenus();
}

//Load More Lightbox
// Requires the following page elements:
//
//<div id='tableDiv'></div>
//<div id='buttonDiv' style="text-align: center;"></div>
//<span id='hiddenSpan' style="display: none;"></span>

function initializeTable() {
  //Builds the initial table

  var data = resetData();

  if ( data.length === 0 ) {
    //Insert "none" message into Div
    var noneText = JS_RESOURCES['bb.instructorView.lightbox.emptyMsg'];
    var textNode = document.createTextNode( noneText );

    $('tableDiv').setStyle({
      textAlign:'center'
    });
    $('tableDiv').addClassName('noItems');
    $('tableDiv').addClassName('$emptyMsgCustomClass');

    $('tableDiv').appendChild(textNode);

  } else {

    var table = document.createElement("table");
    table.className = "inventory sortable";

    //Create Header Row
    var thead = document.createElement("thead");
    var tr1 = document.createElement("tr");
    var th = document.createElement("th");
    var localizedStr = JS_RESOURCES['bb.instructorView.lightbox.name'];
    var headerText = document.createTextNode(localizedStr);
    th.appendChild(headerText);
    tr1.appendChild(th);

    th = document.createElement("th");
    localizedStr = JS_RESOURCES['bb.instructorView.lightbox.dateRec'];
    headerText = document.createTextNode(localizedStr);
    th.appendChild(headerText);
    tr1.appendChild(th);

    thead.appendChild(tr1);
    table.appendChild(thead);

    //Create Table body
    var tbody = document.createElement("tbody");
    insertBodyRows( tbody, data );
    table.appendChild(tbody);

    $('tableDiv').update();
    $('tableDiv').appendChild(table);
  }
}

function loadMore() {
  //Inserts new values into the existing table

  var data = resetData();
  var body = document.getElementById("tableDiv").getElementsByTagName("tbody")[0];
  insertBodyRows( body, data );
}

function resetData() {

  var data = getNextPage();

  if ( data.length > 0 ) {
    document.getElementById("hiddenSpan").innerHTML = data[data.length-1].id;
  }

  var loadMoreBtn = document.getElementById("loadMoreBtn");
  if ( data.length === 25 && loadMoreBtn === null ) {
    //Insert Load More button
    //The button will appear if the result set is a multiple of 25, but clicking it should result in the removal of the button
    //    since the next page will contain 0 elements
    loadMoreBtn = document.createElement('button');
    loadMoreBtn.id = 'loadMoreBtn';
    if ( !Prototype.Browser.IE ) {
      loadMoreBtn.type = 'button';
    }
    loadMoreBtn.innerHTML = JS_RESOURCES['bb.instructorView.lightbox.loadMore'];
    loadMoreBtn.onclick = function() {
      loadMore();
      return false;
    };

    document.getElementById("buttonDiv").appendChild(loadMoreBtn);
  } else if ( data.length !== 25 && loadMoreBtn !== null ){
    //Remove Load More button
    $('loadMoreBtn').remove();
  }
  return data;
}

function insertBodyRows( body, data ) {

  var courseId = JS_RESOURCES['bb.instructorView.lightbox.courseId'];

  for (var index = 0; index < data.length; ++index) {
     var recipient = data[index];
     //Create new row
     var tr2 = document.createElement("tr");

     //First Column
     var td = document.createElement("td");
     var cellText = recipient.userGivenName + " " + recipient.userFamilyName;
     var textNode = document.createTextNode( cellText );

     var a = document.createElement('a');
     if ( recipient.avatarImgLocation !== null ) {
       var img = document.createElement('img');
       img.src = recipient.avatarImgLocation;
       img.style.maxHeight = '75px';
       img.style.maxWidth = '75px';
       a.appendChild(img);
     }
     a.appendChild(textNode);

     a.title = cellText;
     a.href = 'studentViewAchievements.form?course_id=' + courseId + '&user_id=' + recipient.userId;

     td.appendChild(a);
     tr2.appendChild(td);

     //Second Column
     var dateColumn = document.createTextNode(recipient.announcedTime);

     var td2 = document.createElement("td");
     td2.appendChild(dateColumn);
     tr2.appendChild(td2);

     body.appendChild(tr2);
  }

}

function getNextPage() {
  //Get the data to insert on the next page of the table
  var retVal = '';
  var contentId = JS_RESOURCES['bb.instructorView.lightbox.contentId'];
  new Ajax.Request('getRecipientList.form', {
                method: 'get',
                asynchronous: false,
                parameters: {content_id: contentId, lastVOId: document.getElementById('hiddenSpan').innerHTML },
                onSuccess: function(transport) {
                  retVal = transport.responseText.evalJSON(true);
                },
                onFailure: function(transport) {
                  alert(transport);
                }
   });
  return retVal;
}
