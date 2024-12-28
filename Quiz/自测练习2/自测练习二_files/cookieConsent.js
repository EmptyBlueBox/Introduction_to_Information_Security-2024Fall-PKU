CookieConsent = Class.create();
CookieConsent.prototype =
  {
      initialize : function( b2URLBase )
      {
        this.b2URLBase = b2URLBase;
        this.CONSENT_COOKIE_NAME = 'COOKIE_CONSENT_ACCEPTED';
      },

      checkCookieAcceptance : function( nonceParameter, isFrameSetSupported )
      {
        var cookieString = getCookie( this.CONSENT_COOKIE_NAME );

        if ( cookieString === null )
        { // cookie wasn't found
          var backURL = top.location.href;
          var consentURL = this.b2URLBase + 'execute/consent?backURL=' + escape( backURL ) + '&preview=false' + '&' + nonceParameter;
          if ( isFrameSetSupported )
          {
            this.cookieLB = new lightbox.Lightbox(
            {
                useDefaultDimensionsAsMinimumSize : true,
                closeOnBodyClick : false,
                showCloseLink : false,
                onClose : this.onClose,
                lbTemplate : '<div class="lb-content CookieConsent" aria-live="assertive"></div>',
                top: 50,
                ajax :
                {
                    url : consentURL,
                    loadExternalScripts : true
                },
                setPositionAbsolute: true //so that small device widths can access the agree button
            } );
            this.cookieLB.open();
          }
          else
          {
            top.location.href = consentURL;
          }
        }
      },

      showPolicy : function( nonceParameter, isFrameSetSupported ) {
        var backURL = top.location.href;
        var consentURL = this.b2URLBase + 'execute/consent?backURL=' + escape( backURL ) + '&preview=true' + '&' + nonceParameter;
        if ( isFrameSetSupported )
        {
          this.cookieLB = new lightbox.Lightbox(
          {
              useDefaultDimensionsAsMinimumSize : true,
              closeOnBodyClick : false,
              showCloseLink : false,
              lbTemplate : '<div class="lb-content CookieConsent" aria-live="assertive"></div>',
              top: 50,
              ajax :
              {
                  url : consentURL,
                  loadExternalScripts : true
              }
          } );
          this.cookieLB.open();
        }
        else
        {
          top.location.href = consentURL;
        }
      },

      agree : function( backURL )
      {
        // Set expire to 10 years later.
        var expiredate = new Date();
        expiredate.setFullYear( expiredate.getFullYear() + 10 );
        setCookie( this.CONSENT_COOKIE_NAME, true, expiredate );
        lightbox.acceptButtonClicked = true;
        this.close();
      },

      onClose : function() {
        // This is called if a close event happens, such as Escape key; if the lb wasn't closed by button click then we don't want to close it
        if (!lightbox.acceptButtonClicked) {
          throw new Exception('user clicked escape');
        }
      },

      close : function() {
        lightbox.closeCurrentLightbox();
      }
  };
