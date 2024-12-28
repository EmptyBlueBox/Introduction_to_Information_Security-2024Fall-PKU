/**
 *  This module implements a dynamic tree that can be lazily loaded using Ajax
 */
var dynamictree = {};

/**
 *  Images used in the tree
 */
dynamictree.Images =
{
  EMPTY: getCdnURL( '/images/ci/icons/nlstree/blank.gif' ),
  NONE: getCdnURL( '/images/ci/icons/nlstree/lineints.gif' ),
  NONE_LAST: getCdnURL( '/images/ci/icons/nlstree/lineang.gif' ),
  MINUS: getCdnURL( '/images/ci/icons/nlstree/minusb.gif' ),
  MINUS_LAST: getCdnURL( '/images/ci/icons/nlstree/minusnb.gif' ),
  PLUS: getCdnURL( '/images/ci/icons/nlstree/plusb.gif' ),
  PLUS_LAST: getCdnURL( '/images/ci/icons/nlstree/plusnb.gif' )
};

/**
 * Types of tree nodes
 *
 * JSON format of tree nodes:
 *
 * var myNode = {
 *  type: "ROOT"|"NODE"|"HEADER"|"SEPARATOR"|"HTML",
 *  id: "an id to uniquely identify this node, passed to dynamic loading code when the node is expanded",
 *  expanded: true/false (whether this node is initially expanded),
 *  icon: "URL to an icon to display for this node",
 *  contents: "HTML for the contents of the node (usually a link)",
 *  hasChildren: "Whether this node has/can have children",
 *  children: [array of nodes]
 * }
 */
dynamictree.NodeType =
{
  ROOT: 'ROOT', //the root of a tree, is invisible
  NODE: 'NODE', //a node in a tree
  HEADER: 'HEADER', //a header in a tree
  SEPARATOR: 'SEPARATOR', //a separator in a tree
  HTML: 'HTML' // HTML to be displayed unformatted within tree
};

dynamictree.StoreScope =
{
  SESSION: 'Session',
  PERMANENT: 'Permanent'
};

dynamictree.Tree = Class.create();
dynamictree.Tree.prototype =
{
  /**
     * Creates a new tree.
     *
     * @param container
     *            the page element that will contain the tree
     * @param initialTrees
     *            a list of ROOT type nodes to initially populate the tree with
     * @param generatorUrl
     *            URL to use to dynamically load tree nodes
     * @param contextParameters
     *            additional URL parameters to pass to the generator.
     * @param retainState
     *            whether the state of node expand/collapse should be retained.
     *            Default is false.
     * @param expandAllByDefault
     *            whether the full contents of the tree should be
     *            rendered/expanded on initial display. Default is false.
     * @param storeScope
     *            save ExpandedItemStore in different scope,
     *            StoreScope['SESSION']: in http session
     *            scope;StoreScope['PERMANENT']: in database.
     *            Default is StoreScope['SESSION']
     */
  initialize: function( container, initialTrees, generatorUrl, contextParameters, retainState, expandAllByDefault, storeScope, isMenuExpandable )
  {
    this.container = $(container);
    this.navPaletteContainer = $$('navPaletteContent');
    this.isDynamic = generatorUrl ? true : false;
    this.generatorUrl = generatorUrl;
    this.onPreToggleNodeCallback = null;

    this.retainState = false;
    if ( retainState )
    {
      this.retainState = retainState;
    }

    this.storeScope = dynamictree.StoreScope.SESSION;
    if ( storeScope )
    {
      this.storeScope = storeScope;
    }

    this.expandAllByDefault = false;
    if ( expandAllByDefault )
    {
      this.expandAllByDefault = expandAllByDefault;
    }

    if ( contextParameters )
    {
      this.contextParameters = contextParameters.toQueryParams();
    }
    else
    {
      this.contextParameters = {};
    }

    this.expandStr = page.bundle.getString("dynamictree.expand");
    this.collapseStr = page.bundle.getString("dynamictree.collapse");

    if ( initialTrees )
    {
      this.initTree( initialTrees );

      // now that the tree is rendered expand it if we are supposed to
      if ( this.expandAllByDefault )
      {
        this.expandAll();
      }
    }
    else if ( this.isDynamic )
    {
      // dynamically load the initial tree if none is specified, load either the
      // full tree or simply initialize depending on the expandByDefault value
      if ( this.expandAllByDefault )
      {
        this.expandAll();
      }
      else
      {
        this.loadInitialTree();
      }
    }
    if (isMenuExpandable) {
            this.container.addClassName("expTreeContainer");
            (function() { this.container.style.overflow = 'hidden'; }.bind(this).defer());
            Event.observe(this.container, "mouseover", this.menuExpand
                    .bindAsEventListener(this));
            Event.observe(this.container, "mouseout", this.menuExpand
                    .bindAsEventListener(this));
        }
  },

  getExpandFolderAlt: function( toggleNode )
  {
    if ( toggleNode.folderName )
    {
      return page.bundle.getString("dynamictree.expand.folder", toggleNode.folderName);
    }
    else
    {
      return page.bundle.getString("dynamictree.expand");
    }
  },

  getCollapseFolderAlt: function( toggleNode )
  {
    if ( toggleNode.folderName )
    {
      return page.bundle.getString("dynamictree.collapse.folder", toggleNode.folderName);
    }
    else
    {
      return page.bundle.getString("dynamictree.collapse");
    }
  },

  /**
   * Callback function to call prior to toggling the tree node.  Callback
   * can cancel the toggle by returning false.
   */
  setOnPreToggleNodeCallback: function( functionCallback )
  {
    this.onPreToggleNodeCallback = functionCallback;
  },

  /**
   *  Dynamically load the initial tree (since one wasn't specified)
   */
  loadInitialTree: function()
  {
    var params = Object.extend({ initTree: "true",storeScope: this.storeScope }, this.contextParameters);
    new Ajax.Request( this.generatorUrl,
    {
      method: 'post',
      parameters: params,
      requestHeaders: { cookie: document.cookie },
      onSuccess: this.afterInitLoad.bind( this )
    });
  },

  /**
   * Callback invoked after the whole-tree-load Ajax call returns.
   */
  afterInitLoad: function( req )
  {
    try
    {
      var result = req.responseText.evalJSON( true );
      if ( result.success != 'true' )
      {
        new page.InlineConfirmation("error", result.errorMessage, false );
      }
      else
      {
        this.initTree( result.children );
      }
    }
    catch ( e )
    {
      //Invalid response
    }
  },

  /**
   *  Draw the whole tree using the specified array of root nodes.
   */
  initTree: function( treesJson )
  {
    var treeHtml = '';
    for ( var i = 0; i < treesJson.length; i++ )
    {
      treeHtml += this.getHtmlForNode( treesJson[i], i == (treesJson.length - 1) );
    }

    this.container.innerHTML = treeHtml;
    this.container.getElementsBySelector("img.treeNodeToggler").each( function( toggler )
    {
      var linkArea = this.getLinkAndArea(toggler);
      Event.observe( linkArea.toggleLink, "click", this.onNodeToggleClick.bindAsEventListener( this, linkArea.toggleLink, toggler, linkArea.toggleArea ) );
    }.bind(this));

    $A(this.container.getElementsByTagName("h4")).each( function( toggler )
    {
      var toggleLink = toggler.getElementsByTagName('a')[0];
      var toggleArea = toggler.nextSibling;
      Event.observe( toggleLink, "click", this.onNodeToggleClick.bindAsEventListener( this, toggleLink, toggler, toggleArea ) );
    }.bind(this));
  },

  upToTagName: function(element, tagName)
  {
    while (element)
    {
      element = element.parentNode;
      if (tagName == element.tagName.toLowerCase()) {
        break;
      }
    }
    return element;
  },

  getLinkAndArea: function(toggler)
  {
    // aka link = toggler.up('a')
    // aka area = toggler.up('li').down('ul);
    var toggleLink = undefined;
    var toggleArea = undefined;
    var element = toggler;
    while (element && (!toggleLink || !toggleArea))
    {
      element = element.parentNode;
      var tagName = element.tagName.toLowerCase();
      if (tagName == 'a') {
        toggleLink = element;
      } else if (tagName == 'li') {
        toggleArea = element.getElementsByTagName('ul')[0];
        // try to get the folder name from the span tag first.
        // this is used in the Performance Dashboard - Adaptive Release
        // popup window.
        var fname = element.getElementsByTagName('span')[0];
        if ( fname )
        {
          toggler.folderName = fname.title.strip();
        }
        // if you can not get the folder name from the span tag,
        // it will be in the second anchor tag.  this is used
        // for the course menu on the left.
        else
        {
          fname = element.getElementsByTagName('a')[1];  // 2nd anchor is folder name
          toggler.folderName = fname.innerHTML.strip();
        }
        if ( toggler.alt == this.expandStr )
        {
          toggler.alt = this.getExpandFolderAlt( toggler );
        }
        else
        {
          toggler.alt = this.getCollapseFolderAlt( toggler );
        }
        toggleLink.title = toggler.alt;
      }
    }
    return {toggleLink: toggleLink, toggleArea: toggleArea};
  },

  /**
   * Collapse all the nodes in the tree
   */
  collapseAll: function( )
  {
    if ( this.retainState )
    {
      var params = Object.extend({ collapseAll: "true", saveState: "true", storeScope: this.storeScope }, this.contextParameters );
      new Ajax.Request( this.generatorUrl,
      {
        method: 'post',
        parameters: params,
        requestHeaders: { cookie: document.cookie },
        onSuccess: this.collapseCallBack.bind( this )
      });
    }

    this.container.getElementsBySelector("img.treeNodeToggler").each( function( toggler )
    {
      if ( toggler.src.indexOf( dynamictree.Images.NONE ) < 0 && toggler.src.indexOf( dynamictree.Images.NONE_LAST ) < 0 )
      {
        var linkArea = this.getLinkAndArea(toggler);
        if ( toggler.src.indexOf( dynamictree.Images.MINUS ) >= 0 )
        {
          toggler.src = dynamictree.Images.PLUS;
        } else if ( toggler.src.indexOf( dynamictree.Images.MINUS_LAST ) >= 0 )
        {
          toggler.src = dynamictree.Images.PLUS_LAST;
        }
        toggler.alt = this.getExpandFolderAlt( toggler );
        linkArea.toggleLink.title = toggler.alt;
        linkArea.toggleArea.style.display = 'none';
      }
    }.bind(this));
  },

  /**
   * Expand all the nodes in the tree.
   */
  expandAll: function( )
  {
    if ( this.isDynamic ) // If it's dynamic we load the entire tree from the server
    {
      var params = Object.extend({ expandAll: "true" }, this.contextParameters);
      params = Object.extend({ storeScope: this.storeScope}, params);
      new Ajax.Request( this.generatorUrl,
      {
        method: 'post',
        parameters: params,
        requestHeaders: { cookie: document.cookie },
        onSuccess: this.afterInitLoad.bind( this )
      });
    }
    else
    {
      this.container.getElementsBySelector("img.treeNodeToggler").each( function( toggler )
      {
        var linkArea = this.getLinkAndArea(toggler);
        var hasChildren = (linkArea.toggleArea.getElementsByTagName('li').length !== 0);
        if ( hasChildren )
        {
          if ( toggler.src.indexOf( dynamictree.Images.PLUS ) )
          {
            toggler.src = dynamictree.Images.MINUS;
          } else if ( toggler.src.indexOf( dynamictree.Images.PLUS_LAST ) )
          {
            toggler.src = dynamictree.Images.MINUS_LAST;
          }
          toggler.alt = this.getCollapseFolderAlt( toggler );
          linkArea.toggleLink.title = toggler.alt;
          linkArea.toggleArea.style.display = '';
        }
        else
        {
          if ( toggler.src.indexOf( dynamictree.Images.PLUS ) )
          {
            toggler.src = dynamictree.Images.EMPTY;
          } else if ( toggler.src.indexOf( dynamictree.Images.PLUS_LAST ) )
          {
            toggler.src = dynamictree.Images.EMPTY_LAST;
          }
          toggler.alt = '';
          linkArea.toggleLink.title = '';
        }
      }.bind(this));
    }
  },

  /**
   *  Event handler for when a use clicks on the [+/-] toggle images
   *  @param event the dom event
   *  @param toggleLink the link used to toggle the node
   *  @param toggleImage the expand/collapse image element for this node
   *  @param toggleArea the html element containing the children of this node.
   */
  onNodeToggleClick: function( event, toggleLink, toggleImage, toggleArea )
  {
    if ( this.onPreToggleNodeCallback )
    {
      if ( this.onPreToggleNodeCallback( toggleLink ) === false )
      {
        if ( event )
        {
          Event.stop( event );
        }
        return false;
      }
    }

    var id, params, firstParams, hasChildren;
    if ( !toggleImage.src )
    {
      if ( toggleImage.className == "treeSubhead-collapsed" )
      {
        hasChildren = (toggleArea.getElementsByTagName('li').length !== 0);
        if ( !hasChildren && this.isDynamic )
        {
          id = this.upToTagName( toggleLink, 'h4').id;
          params = Object.extend({ itemId: id }, this.contextParameters);
          params = Object.extend({ storeScope: this.storeScope}, params);
          new Ajax.Request( this.generatorUrl,
          {
            method: 'post',
            parameters: params,
            requestHeaders: { cookie: document.cookie },
            onSuccess: this.afterNodeLoad.bind( this, toggleLink, toggleImage, toggleArea )
          });
        }
        else if ( this.retainState )
        {
          id = this.upToTagName( toggleLink, 'h4').id;
          firstParams = Object.extend({ itemId: id }, this.contextParameters );
          params = Object.extend({ collapse: "false" }, firstParams );
          params = Object.extend({ saveState: "true" }, params);
          params = Object.extend({ storeScope: this.storeScope}, params);
          new Ajax.Request( this.generatorUrl,
          {
            method: 'post',
            parameters: params,
            requestHeaders: { cookie: document.cookie },
            onSuccess: this.collapseCallBack.bind( this  )
          });
        }
        toggleImage.className = "";
        toggleArea.style.display = '';
      }
      else
      {
        toggleImage.className = "treeSubhead-collapsed";
        toggleArea.style.display = 'none';
        if ( this.retainState )
        {
          id = this.upToTagName( toggleLink, 'h4').id;
          firstParams = Object.extend({ itemId: id }, this.contextParameters );
          params = Object.extend({ collapse: "true" }, firstParams );
          params = Object.extend({ saveState: "true" }, params);
          params = Object.extend({ storeScope: this.storeScope}, params);
          new Ajax.Request( this.generatorUrl,
          {
            method: 'post',
            parameters: params,
            requestHeaders: { cookie: document.cookie },
            onSuccess: this.collapseCallBack.bind( this  )
          });
        }
      }
    }
    else
    {
      if (  toggleImage.src.indexOf( dynamictree.Images.MINUS ) >= 0 || toggleImage.src.indexOf( dynamictree.Images.MINUS_LAST ) >= 0 )
      {
        this.collapseTreeNode( toggleLink, toggleImage, toggleArea);
      }
      else if ( toggleImage.src.indexOf( dynamictree.Images.PLUS ) >= 0 || toggleImage.src.indexOf( dynamictree.Images.PLUS_LAST ) >= 0 )
      {
        // this node has no children if it does not have a child "li" or if
        // it does and the "li" has a special class indicating that it is empty
        var node = toggleArea.getElementsByTagName("li");
        if (node.length === 0)
        {
          node = null;
        }
        else
        {
          node = node[0];
        }
        hasChildren = node && ( !page.util.hasClassName( node, '--empty--' ) );

        if ( !hasChildren && this.isDynamic )
        {
          id = this.upToTagName( toggleLink, 'li').id;
          params = Object.extend({ itemId: id }, this.contextParameters);
          params = Object.extend({ storeScope: this.storeScope}, params);
          new Ajax.Request( this.generatorUrl,
          {
            method: 'post',
            parameters: params,
            requestHeaders: { cookie: document.cookie },
            onSuccess: this.afterNodeLoad.bind( this, toggleLink, toggleImage, toggleArea )
          });
        }
        else
        {
          if ( this.retainState )
          {
            id = this.upToTagName( toggleLink, 'li').id;
            firstParams = Object.extend({ itemId: id }, this.contextParameters );
            params = Object.extend({ collapse: "false" }, firstParams );
            params = Object.extend({ saveState: "true" }, params);
            params = Object.extend({ storeScope: this.storeScope}, params);
            new Ajax.Request( this.generatorUrl,
            {
              method: 'post',
              parameters: params,
              requestHeaders: { cookie: document.cookie }
            });
          }
          if ( toggleImage.src.indexOf( dynamictree.Images.PLUS ) >= 0 )
          {
            if ( !hasChildren )
            {
              toggleImage.src = dynamictree.Images.NONE;
              toggleImage.alt = '';
              toggleLink.title = '';
            }
            else
            {
              toggleImage.src = dynamictree.Images.MINUS;
              toggleImage.alt = this.getCollapseFolderAlt( toggleImage );
              toggleLink.title = toggleImage.alt;
              toggleArea.style.display = '';
            }
          }
          else
          {
            if ( !hasChildren )
            {
              toggleImage.src = dynamictree.Images.NONE_LAST;
              toggleImage.alt = '';
              toggleLink.title = '';
            }
            else
            {
              toggleImage.src = dynamictree.Images.MINUS_LAST;
              toggleImage.alt = this.getCollapseFolderAlt( toggleImage );
              toggleLink.title = toggleImage.alt;
              toggleArea.style.display = '';
            }
          }
        }
      }
    }

    Event.stop( event );
  },

  collapseTreeNode: function( toggleLink, toggleImage, toggleArea )
  {
    toggleArea.style.display = 'none';
    if ( this.retainState )
    {
      var id = this.upToTagName( toggleLink, 'li').id;
      var firstParams = Object.extend({ itemId: id }, this.contextParameters );
      var params = Object.extend({ collapse: "true" }, firstParams );
      params = Object.extend({ saveState: "true" }, params);
      params = Object.extend({ storeScope: this.storeScope}, params);
      new Ajax.Request( this.generatorUrl,
      {
        method: 'post',
        parameters: params,
        requestHeaders: { cookie: document.cookie },
        onSuccess: this.collapseCallBack.bind( this  )
      });
    }
    if ( toggleImage.src.indexOf( dynamictree.Images.MINUS ) >= 0 )
    {
      toggleImage.src = dynamictree.Images.PLUS;
    }
    else
    {
      toggleImage.src = dynamictree.Images.PLUS_LAST;
    }
    toggleImage.alt = this.getExpandFolderAlt( toggleImage );
    toggleLink.title = toggleImage.alt;
  },

  /**
    Callback for the Collapse Method:Not doing anything
  **/
  collapseCallBack: function( event)
  {
  },

  /**
   *  Callback invoked after a node is lazily loaded in (after the [+] is clicked)
   *  @param toggleLink the link used to toggle the node
   *  @param toggleImage the expand/collapse image element for this node
   *  @param toggleArea the html element containing the children of this node.
   *  @param req the XMLHttpRequest used to load the nodes
   */
  afterNodeLoad: function( toggleLink, toggleImage, toggleArea, req )
  {
    var result;
    try
    {
      result = req.responseText.evalJSON( true );
      if ( result.success != 'true' )
      {
        new page.InlineConfirmation("error", result.errorMessage, false );
      }
      else
      {
        var children = result.children;
        var hasChildren = (children && children.length > 0);
        if ( hasChildren )
        {
          var childrenHtml = '';
          for ( var i = 0; i < children.length; i++ )
          {
            childrenHtml += this.getHtmlForNode( children[i], i == (children.length - 1) );
          }
          toggleArea.innerHTML = childrenHtml;
          toggleArea.style.display = '';
          $(toggleArea).getElementsBySelector("img.treeNodeToggler").each( function( toggler )
          {
            var linkArea = this.getLinkAndArea(toggler);

            var tLink = linkArea.toggleLink;
            var tArea = linkArea.toggleArea;
            Event.observe( tLink, "click", this.onNodeToggleClick.bindAsEventListener( this, tLink, toggler, tArea ) );
          }.bind(this));
        }

        if ( toggleImage.src.indexOf( dynamictree.Images.PLUS ) >= 0 )
        {
          if ( !hasChildren )
          {
            toggleImage.src = dynamictree.Images.NONE;
            toggleImage.alt = '';
            toggleLink.title = '';
          }
          else
          {
            toggleImage.src = dynamictree.Images.MINUS;
            toggleImage.alt = this.getCollapseFolderAlt( toggleImage );
            toggleLink.title = toggleImage.alt;
          }
        }
        else
        {
          if ( !hasChildren )
          {
            toggleImage.src = dynamictree.Images.NONE_LAST;
            toggleImage.alt = '';
            toggleLink.title = '';
          }
          else
          {
            toggleImage.src = dynamictree.Images.MINUS_LAST;
            toggleImage.alt = this.getCollapseFolderAlt( toggleImage );
            toggleLink.title = toggleImage.alt;
          }
        }

        if ( !hasChildren ) // No link anymore
        {
          var parent = toggleLink.parentNode;
          Element.remove( toggleLink );
          parent.insertBefore( toggleImage, parent.firstChild );
        }
      }
    }
    catch ( e )
    {
      // Invalid response
    }
  },

  /**
   *  Generates the HTML for a tree node
   */
  getHtmlForNode: function( node, isLast )
  {
    var result = '', children, i;
    if ( node.type == dynamictree.NodeType.ROOT )
    {
      result = '<ul class="tree"';
      if ( node.id )
      {
        result += ' id="' + node.id +'"';
      }
      result += '>';

      children = node.children;
      if ( children && children.length > 0 )
      {
        for ( i = 0; i < children.length; i++ )
        {
          result += this.getHtmlForNode( children[i], i == (children.length - 1) );
        }
      }
      result += '</ul>';
    }
    else if ( node.type == dynamictree.NodeType.HEADER )
    {
      var colors = "";
      if( node.areaColor )
      {
        colors += node.areaColor;
      }

      if( node.textColor )
      {
        colors += node.textColor;
      }

      result = '<li class="subhead"><h4 ';

      result +=  'id="' + node.id +'"';
      if ( node.expanded )
      {
    	result +='class="">';
      }
      else
      {
    	result +='class="treeSubhead-collapsed">';
      }
      result +='<a href="#" style="'+colors+'">' + node.contents + '</a></h4>';
      children = node.children;
      if ( children && children.length > 0 )
      {
        if ( node.expanded )
        {
          result += '<ul>';
        }
        else
        {
          result += '<ul style="display:none;">';
        }

        for ( i = 0; i < children.length; i++ )
        {
          result += this.getHtmlForNode( children[i], i == (children.length - 1) );
        }
        result += "</ul>";
      }
      result += '</li>';
    }
    else if ( node.type == dynamictree.NodeType.NODE )
    {
      /*
       * Node rendering is a multi-step process.  We start by building a list
       * into which we can dump the current node we are rendering
       */
      if ( isLast )
      {
        result = '<li class="last" id="' + node.id + '">';
      }
      else
      {
        result = '<li id="' + node.id + '">';
      }

      /*
       * Now render the tree controls (plus/minus sign) along with the image
       * (dotted lines) that show this node' place in the hierarchy
       */
      children = node.children;
      var hasChildren = node.hasChildren;
      var img;
      if ( !hasChildren || ( children && children.length > 0 ) )
      {
        if ( children.length > 0 )
        {
          if ( node.expanded )
          {
            img = ( isLast ? dynamictree.Images.MINUS_LAST : dynamictree.Images.MINUS );
            result += '<a href="#" class="toggle" title="' + this.collapseStr.escapeHTML() + '"><img src="' + img + '" class="treeNodeToggler" width="18" height="18" alt="' + this.collapseStr.escapeHTML() + '"></a>';
          }
          else
          {
            img = ( isLast ? dynamictree.Images.PLUS_LAST : dynamictree.Images.PLUS );
            result += '<a href="#" class="toggle" title="' + this.expandStr.escapeHTML() + '"><img src="' + img + '" class="treeNodeToggler" width="18" height="18" alt="' + this.expandStr.escapeHTML() + '"></a>';
          }
        }
        else
        {
          img = ( isLast ? dynamictree.Images.NONE_LAST : dynamictree.Images.NONE );
          result += '<img src="' + img+'" alt="" width="18" height="18">';
        }
      }
      else
      {
        img = ( isLast ? dynamictree.Images.PLUS_LAST : dynamictree.Images.PLUS );
        result += '<a href="#" class="toggle" title="' + this.expandStr.escapeHTML() + '"><img src="' + img + '" class="treeNodeToggler" width="18" height="18" alt="' + this.expandStr.escapeHTML() + '"></a>';
      }

      /*
       * Render the node icon
       */
      if ( node.icon )
      {
        result += '<img src="' + node.icon + '" alt="" class="treeNodeIcon">';
      }
      result += node.contents;

      /*
       * Now render the children of this node if it has any
       */
      if ( hasChildren )
      {
        if ( children && children.length > 0 )
        {
          if ( node.expanded )
          {
            result += '<ul>';
          }
          else
          {
            result += '<ul style="display:none;">';
          }
          for ( i = 0; i < children.length; i++ )
          {
            result += this.getHtmlForNode( children[i], i == (children.length - 1) );
          }
          result += '</ul>';
        }
        else
        {
          // it is invalid to show a <ul></ul> without a child <li></li>.  Give
          // the "empty" <li> a special class so that we can distinguish this
          // case from the situation where a node actually has no children --
          // this distinction is necessary for determining whether we need to
          // go back to the server to dynamically load children for a node.
          result += '<ul style="display:none;"><li class="--empty--"></li></ul>';
        }
      }

      result+= '</li>';
    }
    else if ( node.type == dynamictree.NodeType.HEADER )
    {
      result = '<h4 class="treehead">'+node.contents+'</h4>';
    }
    else if ( node.type == dynamictree.NodeType.SEPARATOR )
    {
      result = '<hr>';
    }
    else if ( node.type == dynamictree.NodeType.HTML )
    {
      result = '<li><div class="none">' + node.contents + '</div></li>';
    }
    return result;
  },

  menuExpand : function(evt) {
        var parentContainer = this.container.ancestors()[0];
        var parentContainerBackgroundColor = this.getCurrentStyle( parentContainer, 'background-color' );
        var parentContainerWidth = parentContainer.clientWidth - 1;
        var scrollWidth = this.container.scrollWidth;
        if ( scrollWidth <= parentContainerWidth )
        {
          // No Extra data displayed.
          return;
        }
        var ek = evt.type;
        if ( ek == 'mouseover' )
        {
            this.container.style.zIndex = '10000000';
            this.container.style.position = 'relative';
            containerWidth = scrollWidth ;
            new Effect.Morph(
                    this.container,
                    {
                        style :'border:1px solid #999999; width:' + containerWidth + 'px; opacity:0.94; background:' + parentContainerBackgroundColor,
                        duration :0,
                        queue : {
                            scope :'open'
                        }
                    });
            var queue = Effect.Queues.get('close');
            queue.each( function(effect) {
                effect.cancel();
            });
        }
        else
        {
            this.container.style.zIndex = 'auto';
            new Effect.Morph(
                    this.container,
                    {
                        style :'border:0px; opacity:1.0;background:transparent;width:' + parentContainerWidth + 'px',
                        duration :0,
                        queue : {
                            scope :'close'
                        }
                    });
            var queueClose = Effect.Queues.get('open');
            queueClose.each( function(effect) {
                effect.cancel();
            });
        }
    },

    getCurrentStyle : function(oElm, strCssRule) {
        var strValue = "";
        if (document.defaultView && document.defaultView.getComputedStyle) {
            strValue = document.defaultView.getComputedStyle(oElm, "")
                    .getPropertyValue(strCssRule);
        } else if (oElm.currentStyle) {
            strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
                return p1.toUpperCase();
            });
            strValue = oElm.currentStyle[strCssRule];
        }
        return strValue;
    }
};
