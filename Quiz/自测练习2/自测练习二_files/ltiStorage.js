if (!window.ltiStorage) {
  let ltiStorage = {
    storedData: {}
  };

  const handlePutData = function(event) {
    if (!ltiStorage.storedData[event.origin]) {
      ltiStorage.storedData[event.origin] = {};
    }
    ltiStorage.storedData[event.origin][event.data.key] = event.data.value;
    let sub = event.data.subject + '.response';
    event.source.postMessage({
      subject: sub,
      message_id: event.data.message_id,
      key: event.data.key,
      value: event.data.value
    }, event.origin);
  }

  const handleGetData = function(event) {
    if (ltiStorage.storedData[event.origin] && ltiStorage.storedData[event.origin][event.data.key]) {
      let sub = event.data.subject + '.response';
      event.source.postMessage({
        subject: sub,
        message_id: event.data.message_id,
        key: event.data.key,
        value: ltiStorage.storedData[event.origin][event.data.key]
      }, event.origin);
    }
  }

  // Declare an event listener for messages to put and get data, capabilities, etc.
  window.addEventListener('message', function (event) {
    if (event.data) {
      switch (event.data.subject) {
        case 'lti.put_data':
          handlePutData(event);
          break;
        case 'lti.get_data':
          handleGetData(event);
          break;
        // After the latest changes for LRN-201504 in the Capabilities.js file have been moved to the production environment, we will need to remove the following case.
        case 'org.imsglobal.lti.put_data':
          handlePutData(event);
          break;
        case 'org.imsglobal.lti.get_data':
          handleGetData(event);
          break;
        default:
        // We can't log every unknown subject console.log(`Unknown subject ${event.data.subject}`);
      }
    }
  }, false);
}
