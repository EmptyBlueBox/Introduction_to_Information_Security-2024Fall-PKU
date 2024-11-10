if ( !window.lticapabilities ) {
  let lticapabilities = {};

  /*
    Handles the capabilities request from an LTI tool
   */
  function handleCapabilities( event ) {
    const FRAME_NAME = 'lti_storage_frame'
    event.source.postMessage( {
      message_id: event.data.message_id,
      subject: "org.imsglobal.lti.capabilities.response",
      supported_messages: [
        {
          subject: "org.imsglobal.lti.capabilities",
        },
        {
          subject: "org.imsglobal.lti.get_data",
          frame: FRAME_NAME
        },
        {
          subject: "org.imsglobal.lti.put_data",
          frame: FRAME_NAME
        }
      ]
    }, event.origin );
  }

  // Declare an event listener for messages to get capabilities.
  window.addEventListener( 'message', function ( event ) {
    // We are just returning a list of capabilities so we don't need to check origin
    switch ( event.data.subject )
    {
      case 'org.imsglobal.lti.capabilities':
        handleCapabilities( event );
        break;
      default:
        break;
    }
  }, false );
}
