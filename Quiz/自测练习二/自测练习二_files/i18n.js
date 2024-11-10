/* ==================================================================
 * General i18n functions
 * Copyright (c) 2001 by Blackboard, Inc.,
 * 1899 L Street, NW, 5th Floor
 * Washington, DC, 20036, U.S.A.
 * All rights reserved.
 * Submit RFC & bugs report to: aklimenko@blackboard.com
 * This software is the confidential and proprietary information
 * of Blackboard, Inc. ("Confidential Information").  You
 * shall not disclose such Confidential Information and shall use
 * it only in accordance with the terms of the license agreement
 * you entered into with Blackboard.
 * ==================================================================*/

// internal methods

function _escape(string)
{
  // ?= does not seem to work
  return (''+string).replace(/^'|([^\\])'/g, "$1\\'").replace(/\n/g, "&crlf;");
}


function _unescape(string)
{
  return string.replace(/&crlf;/g, "\n");
}

function _substitute(string, parameters)
{
  for ( var key in parameters)
  {
    if ( parameters.hasOwnProperty( key ) )
    {
      string = eval( "string.replace(/\\{" + key + "\\}/g, '" + _escape(parameters[key]) + "')" );
    }
  }
  return _unescape(string);
}

// Public methods: these methods are instance methods of dynamically generated
// Javascript bundle objects. See Java class blackboard.platform.intl.JsResource
// and Perl module CI::L10n::JsResource.


// Get a string from a resource bundle
function i18n_get_string(key)
{
  return this[key];
}


// Get string and perform substitution using positions (arrays) or names (object)
function i18n_get_formatted_string(key, parameters)
{
  var string = this.getString(key);
  if (string && parameters)
  {
    // Convert to object keyed by string representation of array index
    if ( parameters.constructor.toString() == [].constructor.toString() )
    {
      var array = parameters;
      parameters = {};
      for (var i = 0; i < array.length; ++i)
      {
        parameters[''+i] = array[i];
      }
    }
    string = _substitute(string, parameters);
  }
  return string;
}